from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.parse import router as parse_router
from routes.curriculum import router as curriculum_router
from routes.teaching import router as teaching_router
from routes.users import router as users_router
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


@app.get("/")
def check():
    return {"status": "running fine test number - someting 2"}