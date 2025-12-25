from fastapi import FastAPI
app = FastAPI()

#jai ganesh🙏
@app.get("/")
async def root():
    return {"message": "Hello World"}