from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from services.db_services.db import get_session

router = APIRouter(prefix="/api", tags=["Curriculum"])

@router.get("/curriculum")
async def get_curriculum(
    user_id: str = Query(...),
    db: Session = Depends(get_session)
):
    latest_upload = db.execute(
        text("""
            SELECT MAX(created_at) as latest 
            FROM modules 
            WHERE user_id = CAST(:user_id AS uuid)
        """),
        {"user_id": user_id}
    ).fetchone()
    
    if not latest_upload or not latest_upload.latest:
        return {"modules": []}
    
    modules_result = db.execute(
        text("""
            SELECT id, title, position 
            FROM modules 
            WHERE user_id = CAST(:user_id AS uuid) 
            AND DATE(created_at) = DATE(:latest_date)
            ORDER BY position
        """),
        {"user_id": user_id, "latest_date": latest_upload.latest}
    ).fetchall()
    
    modules = []
    for module_row in modules_result:
        subtopics_result = db.execute(
            text("SELECT id, title, score, position FROM subtopics WHERE module_id = CAST(:module_id AS uuid) ORDER BY position"),
            {"module_id": str(module_row.id)}
        ).fetchall()
        
        subtopics = [
            {
                "id": str(st.id),
                "title": st.title,
                "score": st.score,
                "position": st.position,
                "status": "completed" if st.score >= 100 else "in-progress" if st.score > 0 else "available"
            }
            for st in subtopics_result
        ]
        
        modules.append({
            "id": str(module_row.id),
            "title": module_row.title,
            "position": module_row.position,
            "subtopics": subtopics
        })
    
    return {"modules": modules}
