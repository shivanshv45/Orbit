import uvicorn
import os
import sys
import asyncio

if __name__ == "__main__":
    # Force ProactorEventLoop on Windows for subprocess support
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        
    print("Starting Orbit Backend with Windows Subprocess Support...")
    
    # Run uvicorn without reload to avoid subprocess spawning which resets policy
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False, loop="asyncio")
