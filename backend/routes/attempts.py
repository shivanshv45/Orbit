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
        # 1. Record the attempt history
        db.execute(
            text("""
                INSERT INTO user_attempts (user_id, subtopic_id, score)
                VALUES (:uid, :sid, :score_float)
            """),
            {
                "uid": data.user_id, 
                "sid": data.subtopic_id, 
                "score_float": data.final_score / 100.0
            }
        )

        # 2. Update the main subtopic score
        db.execute(
            text("""
                UPDATE subtopics
                SET score = :score
                WHERE id = :sid
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
