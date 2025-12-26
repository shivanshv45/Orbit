from fastapi import FastAPI
app = FastAPI()

#jai ganesh🙏
@app.get("/")
def happy():
    return {"new":"done"}
@app.get("/health")
def health():
    return {"status":"ok"}