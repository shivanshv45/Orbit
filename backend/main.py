import sys
import asyncio

if sys.platform == 'win32':
    
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.parse import router as parse_router
from routes.curriculum import router as curriculum_router
from routes.teaching import router as teaching_router
from routes.users import router as users_router
from routes.attempts import router as attempts_router
from routes.chat import router as chat_router
from routes.camera import router as camera_router
from routes.revision import router as revision_router
from routes.voice import router as voice_router

from config import get_settings
from dotenv import load_dotenv
load_dotenv()

settings = get_settings()


app = FastAPI(title="Orbit",debug=settings.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parse_router)
app.include_router(curriculum_router)
app.include_router(teaching_router)
app.include_router(users_router)
app.include_router(attempts_router)
app.include_router(chat_router)
app.include_router(camera_router)
app.include_router(revision_router)
app.include_router(voice_router)



@app.on_event("startup")
async def startup_event():
    import asyncio
    loop = asyncio.get_running_loop()
    print(f"Current event loop: {loop}")
    
    from services.tts_service import precache_common_phrases
    try:
        await precache_common_phrases()
        print("Voice cache warmed up successfully")
    except Exception as e:
        print(f"Failed to warm up voice cache: {e}")

@app.get("/")
def check():
    return {"status": "running fine test number - someting 2"}