from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header
from typing import List, Optional
import traceback

from services.manual_parsing import create_modules, get_elements
from services.unstructured_service import parse_files
from services.db_services.db import get_session
from services.db_services.push_to_db import upload_to_db, user_exist
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/parse",
    tags=["Parsing"]
)

@router.post("")
async def parse_pdfs1(
    files: List[UploadFile] = File(...),
    user_id: Optional[str] = Header(None, alias="X-User-Id"),
    user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: Session = Depends(get_session)
):
    try:
        result = await parse_files(files)
        
        elements = get_elements(result)
        modules = create_modules(elements)
        
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        if not user_name:
            user_name = "User"
        
        curriculum_title = files[0].filename.rsplit('.', 1)[0] if files else "Untitled Curriculum"
        
        user_exist(db, user_id, user_name)
        curriculum_id = upload_to_db(db, modules, user_id, curriculum_title)

        return {
            "message": "Parsing completed successfully",
            "job_id": result.get("job_id"),
            "curriculum_id": curriculum_id,
            "modules_created": len(modules)
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
