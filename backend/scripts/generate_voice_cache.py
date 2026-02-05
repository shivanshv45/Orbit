import os
import sys
import hashlib
import subprocess
from pathlib import Path

BACKEND_DIR = Path(__file__).parent.parent
PIPER_BINARY = BACKEND_DIR / "piper" / "piper.exe"
PIPER_MODEL = BACKEND_DIR / "piper_models" / "en_US-amy-medium.onnx"
OUTPUT_DIR = BACKEND_DIR.parent / "frontend" / "public" / "voice_cache"

PHRASES = [
    "Visual impairment mode on. Hold Control to speak commands. Say help for available commands.",
    "Visual impairment mode on",
    "Visual impairment mode off",
    "Listening",
    "Correct! Great job!",
    "Correct! Say next to continue.",
    "Not quite right.",
    "Not quite right. Try again.",
    "Going to next lesson",
    "Going to previous lesson",
    "No next lesson available",
    "No previous lesson available",
    "Speed increased",
    "Speed decreased",
    "Submitting answer",
    "Available commands: Say next to continue. Say repeat to hear again. Say faster or slower to adjust speed. Say help for assistance.",
    "Going to home page",
    "Going to curriculum",
    "Selecting option A",
    "Selecting option B",
    "Selecting option C",
    "Selecting option D",
    "Here is a formula:",
    "Key insight:",
    "Question:",
    "Your options are:",
    "Say the letter of your answer, like A, B, C, or D.",
    "There is an interactive simulation. You can explore it on screen. Say next to continue.",
    "This is the last section.",
    "Lesson complete!",
    "A:",
    "B:",
    "C:",
    "D:",
    "First:",
    "Second:",
    "Third:",
    "Fourth:",
    "Fifth:",
]


def get_cache_filename(text: str) -> str:
    return hashlib.md5(text.lower().strip().encode()).hexdigest() + ".wav"


def generate_voice(text: str, output_path: Path) -> bool:
    if output_path.exists():
        print(f"  [SKIP] Already exists: {text[:50]}...")
        return True
    
    try:
        cmd = [
            str(PIPER_BINARY),
            "--model", str(PIPER_MODEL),
            "--output_file", str(output_path),
        ]
        
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(PIPER_BINARY.parent)
        )
        
        stdout, stderr = process.communicate(input=text.encode("utf-8"), timeout=30)
        
        if process.returncode != 0:
            print(f"  [ERROR] Failed: {text[:50]}... - {stderr.decode()}")
            return False
        
        if output_path.exists() and output_path.stat().st_size > 100:
            print(f"  [OK] Generated: {text[:50]}...")
            return True
        else:
            print(f"  [ERROR] Empty file: {text[:50]}...")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"  [ERROR] Timeout: {text[:50]}...")
        process.kill()
        return False
    except Exception as e:
        print(f"  [ERROR] Exception: {text[:50]}... - {e}")
        return False


def generate_manifest(phrases: list, output_dir: Path) -> None:
    manifest = {}
    for phrase in phrases:
        key = phrase.lower().strip()
        filename = get_cache_filename(phrase)
        if (output_dir / filename).exists():
            manifest[key] = filename
    
    manifest_path = output_dir / "manifest.json"
    import json
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nManifest saved to: {manifest_path}")


def clean_old_files(output_dir: Path, valid_files: set) -> int:
    removed = 0
    for f in output_dir.glob("*.wav"):
        if f.name not in valid_files:
            f.unlink()
            removed += 1
    return removed


def main():
    print("=" * 60)
    print("Piper Voice Cache Generator (Essential Phrases)")
    print("=" * 60)
    
    if not PIPER_BINARY.exists():
        print(f"ERROR: Piper binary not found at {PIPER_BINARY}")
        print("Run: python scripts/setup_piper.py first")
        sys.exit(1)
    
    if not PIPER_MODEL.exists():
        print(f"ERROR: Piper model not found at {PIPER_MODEL}")
        print("Run: python scripts/setup_piper.py first")
        sys.exit(1)
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\nOutput directory: {OUTPUT_DIR}")
    print(f"Total phrases to generate: {len(PHRASES)}")
    print()
    
    valid_files = set()
    success_count = 0
    fail_count = 0
    
    for i, phrase in enumerate(PHRASES, 1):
        filename = get_cache_filename(phrase)
        valid_files.add(filename)
        output_path = OUTPUT_DIR / filename
        print(f"[{i}/{len(PHRASES)}]", end="")
        
        if generate_voice(phrase, output_path):
            success_count += 1
        else:
            fail_count += 1
    
    removed = clean_old_files(OUTPUT_DIR, valid_files)
    if removed > 0:
        print(f"\nCleaned up {removed} old files")
    
    generate_manifest(PHRASES, OUTPUT_DIR)
    
    print()
    print("=" * 60)
    print(f"Complete! Success: {success_count}, Failed: {fail_count}")
    print("=" * 60)


if __name__ == "__main__":
    main()
