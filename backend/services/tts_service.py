import os
import hashlib
import sys
from pathlib import Path
from typing import Optional
import subprocess
import tempfile
import asyncio

PIPER_BINARY = os.getenv("PIPER_BINARY_PATH", "piper")
PIPER_MODEL = os.getenv("PIPER_MODEL_PATH", "en_US-amy-medium.onnx")
CACHE_DIR = Path(__file__).parent.parent / "tts_cache"
CACHE_DIR.mkdir(exist_ok=True)

class TTSService:
    def __init__(self):
        self.model_path = PIPER_MODEL
        self.cache_dir = CACHE_DIR
        self._rate = 1.0
        self._lock = asyncio.Lock()
        
    def _get_cache_key(self, text: str, rate: float = 1.0) -> str:
        content = f"{text}:{rate}:{self.model_path}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _get_cached_audio(self, cache_key: str) -> Optional[bytes]:
        cache_path = self.cache_dir / f"{cache_key}.wav"
        if cache_path.exists():
            return cache_path.read_bytes()
        return None
    
    def _save_to_cache(self, cache_key: str, audio_data: bytes) -> None:
        cache_path = self.cache_dir / f"{cache_key}.wav"
        cache_path.write_bytes(audio_data)
    
    async def synthesize(self, text: str, rate: float = 1.0) -> bytes:
        if not text or not text.strip():
            return b""
        
        cache_key = self._get_cache_key(text, rate)
        cached = self._get_cached_audio(cache_key)
        if cached:
            return cached
        
        audio_data = await self._generate_audio(text, rate)
        
        if audio_data:
            self._save_to_cache(cache_key, audio_data)
        
        return audio_data
    
    def _generate_audio_sync(self, text: str, rate: float = 1.0) -> bytes:
        output_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                output_path = tmp_file.name
            
            length_scale = 1.0 / rate if rate > 0 else 1.0
            
            cmd = [
                PIPER_BINARY,
                "--model", self.model_path,
                "--output_file", output_path,
                "--length_scale", str(length_scale)
            ]
            
            piper_dir = os.path.dirname(PIPER_BINARY) if os.path.dirname(PIPER_BINARY) else None
            
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=piper_dir
            )
            
            stdout, stderr = process.communicate(input=text.encode("utf-8"), timeout=30)
            
            if process.returncode != 0:
                print(f"Piper execution failed with code {process.returncode}")
                print(f"Stderr: {stderr.decode()}")
                return b""
            
            if os.path.exists(output_path):
                with open(output_path, "rb") as f:
                    audio_data = f.read()
                return audio_data
            
            return b""
            
        except subprocess.TimeoutExpired:
            print("Piper TTS timeout")
            if process:
                process.kill()
            return b""
        except Exception as e:
            print(f"Piper TTS exception: {repr(e)}")
            return b""
        finally:
            if output_path and os.path.exists(output_path):
                try:
                    os.unlink(output_path)
                except Exception:
                    pass

    async def _generate_audio(self, text: str, rate: float = 1.0) -> bytes:
        async with self._lock:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._generate_audio_sync, text, rate)
    
    async def synthesize_batch(self, texts: list[str], rate: float = 1.0) -> list[bytes]:
        results = []
        for text in texts:
            result = await self.synthesize(text, rate)
            results.append(result)
        return results
    
    def clear_cache(self) -> int:
        count = 0
        for cache_file in self.cache_dir.glob("*.wav"):
            cache_file.unlink()
            count += 1
        return count
    
    def get_cache_size(self) -> tuple[int, int]:
        files = list(self.cache_dir.glob("*.wav"))
        total_size = sum(f.stat().st_size for f in files)
        return len(files), total_size


tts_service = TTSService()

COMMON_PHRASES = [
    "Visual impairment mode on",
    "Visual impairment mode off",
    "Next lesson",
    "Previous lesson",
    "Going to next lesson",
    "Going to previous lesson",
    "No next lesson available",
    "No previous lesson available",
    "Paused",
    "Resuming",
    "Speech speed increased",
    "Speech speed decreased",
    "Correct!",
    "Not quite right.",
    "Submitting answer",
    "Starting lesson",
    "Returning to curriculum",
    "Question:",
    "Key insight:",
    "Here's the formula:",
]

async def precache_common_phrases():
    for phrase in COMMON_PHRASES:
        await tts_service.synthesize(phrase)
