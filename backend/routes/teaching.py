from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from services.db_services.db import get_session
from services.Gemini_Services.gemini_service import generate_teaching_blocks
import json
import traceback

router = APIRouter(prefix="/api", tags=["Teaching"])

@router.get("/teaching/{subtopic_id}")
async def get_teaching_content(
    subtopic_id: str,
    user_id: str = Query(...),
    db: Session = Depends(get_session)
):
    try:
        cached = db.execute(
            text("SELECT blocks_json FROM teaching_blocks WHERE subtopic_id = CAST(:sid AS uuid)"),
            {"sid": subtopic_id}
        ).fetchone()
        
        if cached:
            # PostgreSQL JSONB returns already-parsed data (list/dict), not a JSON string
            blocks_data = cached.blocks_json if isinstance(cached.blocks_json, list) else json.loads(cached.blocks_json)
            print(f"[DEBUG] Returning cached blocks: {len(blocks_data)} blocks")
            return {
                "blocks": blocks_data,
                "cached": True
            }
        
        subtopic = db.execute(
            text("SELECT title, content, score FROM subtopics WHERE id = CAST(:sid AS uuid)"),
            {"sid": subtopic_id}
        ).fetchone()
        
        if not subtopic:
            raise HTTPException(status_code=404, detail="Subtopic not found")
        
        user_score_result = db.execute(
            text("""
                SELECT AVG(score) * 100 as avg_score
                FROM user_attempts
                WHERE user_id = CAST(:uid AS uuid)
                  AND subtopic_id = CAST(:sid AS uuid)
            """),
            {"uid": user_id, "sid": subtopic_id}
        ).fetchone()
        
        user_score = int(user_score_result.avg_score) if user_score_result and user_score_result.avg_score else 0
        
        print(f"Generating teaching blocks for subtopic: {subtopic.title}, score: {user_score}")
        
        gemini_response = generate_teaching_blocks(
            lesson_title=subtopic.title,
            subtopic_title=subtopic.title,
            lesson_content=subtopic.content,
            learner_score=user_score
        )
        
        print(f"[DEBUG] Gemini response received: {len(gemini_response.blocks)} blocks")
        blocks_list = [block.model_dump() for block in gemini_response.blocks]
        print(f"[DEBUG] Blocks list created: {blocks_list[:2]}")  # First 2 blocks
        blocks_json = json.dumps(blocks_list)
        print(f"[DEBUG] Blocks JSON length: {len(blocks_json)}")
        
        db.execute(
            text("""
                INSERT INTO teaching_blocks (subtopic_id, blocks_json)
                VALUES (CAST(:sid AS uuid), CAST(:blocks AS jsonb))
            """),
            {"sid": subtopic_id, "blocks": blocks_json}
        )
        db.commit()
        print(f"[DEBUG] Saved to database successfully")
        
        print(f"[DEBUG] Returning {len(blocks_list)} blocks to frontend")
        return {
            "blocks": blocks_list,
            "cached": False
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error in teaching endpoint: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
