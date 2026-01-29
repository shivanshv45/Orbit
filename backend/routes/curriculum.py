from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from services.db_services.db import get_session

router = APIRouter(prefix="/api", tags=["Curriculum"])

@router.get("/curriculums")
async def get_user_curriculums(
    user_id: str = Query(...),
    db: Session = Depends(get_session)
):
    curriculums = db.execute(
        text("""
            SELECT id, title, created_at
            FROM curriculums
            WHERE user_id = :uid
            ORDER BY created_at DESC
        """),
        {"uid": user_id}
    ).fetchall()
    
    return {
        "curriculums": [
            {
                "id": str(c.id),
                "title": c.title,
                "created_at": c.created_at.isoformat()
            }
            for c in curriculums
        ]
    }

@router.get("/curriculum")
async def get_curriculum(
    user_id: str = Query(...),
    curriculum_id: str = Query(None),
    db: Session = Depends(get_session)
):
    if curriculum_id:
        target_id = curriculum_id
    else:
        latest = db.execute(
            text("""
                SELECT id FROM curriculums
                WHERE user_id = :uid
                ORDER BY created_at DESC
                LIMIT 1
            """),
            {"uid": user_id}
        ).fetchone()
        
        if not latest:
            return {"modules": []}
        
        target_id = str(latest.id)
    
    modules = db.execute(
        text("""
            SELECT m.id, m.title, m.position
            FROM modules m
            WHERE m.curriculum_id = :cid
            ORDER BY m.position
        """),
        {"cid": target_id}
    ).fetchall()
    
    result = []
    for module in modules:
        subtopics = db.execute(
            text("""
                SELECT id, title, score, position
                FROM subtopics
                WHERE module_id = :mid
                ORDER BY position
            """),
            {"mid": str(module.id)}
        ).fetchall()
        
        result.append({
            "id": str(module.id),
            "title": module.title,
            "subtopics": [
                {
                    "id": str(s.id),
                    "title": s.title,
                    "score": s.score,
                    "status": "completed" if s.score > 0 else "available"
                }
                for s in subtopics
            ]
        })
    
    return {"modules": result, "curriculum_id": target_id}
