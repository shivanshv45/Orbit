import os
from typing import List
from dotenv import load_dotenv

load_dotenv()



class GeminiKeyManager:
    def __init__(self):
        self.keys = self._load_keys()
        self.current_index = 0
        
    def _load_keys(self) -> List[str]:
        keys = []
        
        i = 1
        while True:
            key = os.getenv(f'GEMINI_API_KEY_{i}')
            if not key:
                break
            keys.append(key)
            i += 1
        
        base_key = os.getenv('GEMINI_API_KEY')
        if base_key:
            keys.append(base_key)
        
        if not keys:
            raise ValueError("No GEMINI_API_KEY found in environment")
        
        # Deduplicate keys
        unique_keys = list(set(keys))
        print(f"[DEBUG] Loaded {len(unique_keys)} unique Gemini API keys")
        return unique_keys
    
    def get_next_key(self) -> str:
        if not self.keys:
            raise ValueError("No API keys available")
        
        key = self.keys[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.keys)
        return key
    
    def execute_with_retry(self, func, *args, **kwargs):
        last_error = None
        
        for _ in range(len(self.keys)):
            key = self.get_next_key()
            
            try:
                return func(key, *args, **kwargs)
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    print(f"[WARNING] Quota exhausted for key ending in ...{key[-4:]}, trying next key")
                    last_error = e
                    continue
                else:
                    raise e
        
        raise Exception(f"All API keys exhausted. Last error: {str(last_error)}")

key_manager = GeminiKeyManager()
