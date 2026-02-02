import os
import sys
import shutil
import zipfile
import requests
from pathlib import Path

# URLs
PIPER_WINDOWS_URL = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip"
VOICE_MODEL_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx"
VOICE_MODEL_JSON_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx.json"

# Paths
BACKEND_DIR = Path(__file__).parent.parent
PIPER_DIR = BACKEND_DIR / "piper"
MODELS_DIR = BACKEND_DIR / "piper_models"

def download_file(url, dest_path):
    print(f"Downloading {url} to {dest_path}...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    with open(dest_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print("Download complete.")

def setup_piper_binary():
    if (PIPER_DIR / "piper.exe").exists():
        print("Piper binary already exists.")
        return

    PIPER_DIR.mkdir(exist_ok=True)
    zip_path = PIPER_DIR / "piper_windows.zip"
    
    try:
        download_file(PIPER_WINDOWS_URL, zip_path)
        
        print("Extracting Piper...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # zip contains a 'piper' folder usually
            zip_ref.extractall(BACKEND_DIR)
            
        # Cleanup
        zip_path.unlink()
        
        # Verify
        if not (PIPER_DIR / "piper.exe").exists():
            # Sometimes the zip structure is different, let's check
            extracted_piper = BACKEND_DIR / "piper" / "piper.exe" # if extracted to backend/piper/piper.exe
            if not extracted_piper.exists():
                print("Warning: Could not verify piper.exe location. You may need to adjust the path.")
            
    except Exception as e:
        print(f"Error setting up Piper binary: {e}")

def setup_voice_model():
    MODELS_DIR.mkdir(exist_ok=True)
    
    onnx_path = MODELS_DIR / "en_US-amy-medium.onnx"
    json_path = MODELS_DIR / "en_US-amy-medium.onnx.json"
    
    if not onnx_path.exists():
        try:
            download_file(VOICE_MODEL_URL, onnx_path)
        except Exception as e:
            print(f"Error downloading voice model: {e}")

    if not json_path.exists():
        try:
            download_file(VOICE_MODEL_JSON_URL, json_path)
        except Exception as e:
            print(f"Error downloading voice config: {e}")

def main():
    print("Setting up Piper TTS...")
    setup_piper_binary()
    setup_voice_model()
    print("Piper TTS setup complete.")

if __name__ == "__main__":
    main()
