from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import traceback

from services.manual_parsing import manual_parsing
from services.unstructured_service import parse_files

router = APIRouter(
    prefix="/parse",
    tags=["Parsing"]
)

@router.post("")
async def parse_pdfs(files: List[UploadFile] = File(...)):
    try:
        result = await parse_files(files)
        manual_parsing(result)
        return {
            "message": "Parsing completed successfully",
            **result

        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
