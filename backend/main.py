from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.parse import (router as parse_router)
from config import get_settings
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


@app.get("/")
def check():
    return {"status": "running fine test number - someting 2"}