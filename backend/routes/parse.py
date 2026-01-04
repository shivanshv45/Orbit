from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import traceback

from backend.services.manual_parsing import manual_Parsing
from backend.services.unstructured_service import parse_files


router = APIRouter(
    prefix="/parse",
    tags=["Parsing"]
)

@router.post("")
async def parse_pdfs1(files: List[UploadFile] = File(...)):
    try:
        result = await parse_files(files)
        manual_Parsing(result)
        return {
            "message": "Parsing completed successfully",
            **result

        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
