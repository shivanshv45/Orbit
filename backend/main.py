from fastapi import FastAPI ,File ,UploadFile
from typing import Annotated, Optional
app = FastAPI()

#jai ganesh🙏



@app.get("/")
def happy():
    return {"new":"done"}
@app.get("/health")
def health():
    return {"status":"ok"}


#this is supposed to be the file upload part before unstructured
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    return {"filename":file.filename,"type":file.content_type}


