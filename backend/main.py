from fastapi import FastAPI
app = FastAPI()

#jai ganesh🙏
@app.get("/hamster-desi")
def happysex():
    return {"daddy":"ah! cumming "}
@app.get("/health")
def health():
    return {"status":"ok"}