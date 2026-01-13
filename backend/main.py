from fastapi import FastAPI
from routes.parse import (router as parse_router)
from config import get_settings
settings = get_settings()


app = FastAPI(title="Orbit",debug=settings.DEBUG)

app.include_router(parse_router)


@app.get("/")
def check():
    return {"status": "running fine test number - someting 2"}