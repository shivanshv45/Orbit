from fastapi import FastAPI
from routes.parse import router as parse_router

app = FastAPI(title="Orbit")

app.include_router(parse_router)

@app.get("/")
def check():
    return {"status": "running fine test number - someting 2"}