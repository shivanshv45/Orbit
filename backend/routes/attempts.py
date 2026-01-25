from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from services.db_services.db import get_session
import traceback

router = APIRouter(prefix="/api", tags=["Attempts"])

class ScoreUpdate(BaseModel):
    user_id: str
    subtopic_id: str
    final_score: int

@router.post("/attempts/score")
async def update_subtopic_score(
    data: ScoreUpdate,
    db: Session = Depends(get_session)
):
    try:
        db.execute(
            text("""
                UPDATE subtopics
                SET score = :score
                WHERE id = CAST(:sid AS uuid)
            """),
            {"sid": data.subtopic_id, "score": data.final_score}
        )
        
        db.commit()
        
        return {
            "success": True,
            "final_score": data.final_score
        }
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to update score: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
