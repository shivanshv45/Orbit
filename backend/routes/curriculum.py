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
            SELECT id, title, created_at, is_pinned, is_archived
            FROM curriculums
            WHERE user_id = :uid AND (is_archived IS FALSE OR is_archived IS NULL)
            ORDER BY is_pinned DESC NULLS LAST, created_at DESC
        """),
        {"uid": user_id}
    ).fetchall()
    
    return {
        "curriculums": [
            {
                "id": str(c.id),
                "title": c.title,
                "created_at": c.created_at.isoformat(),
                "is_pinned": bool(c.is_pinned),
                "is_archived": bool(c.is_archived)
            }
            for c in curriculums
        ]
    }

@router.post("/curriculum/{curriculum_id}/pin")
async def pin_curriculum(
    curriculum_id: str,
    user_id: str = Query(...),
    db: Session = Depends(get_session)
):
    # Toggle pin status
    current = db.execute(
        text("SELECT is_pinned FROM curriculums WHERE id = :cid AND user_id = :uid"),
        {"cid": curriculum_id, "uid": user_id}
    ).scalar()
    
    new_status = not current if current is not None else True
    
    db.execute(
        text("UPDATE curriculums SET is_pinned = :status WHERE id = :cid AND user_id = :uid"),
        {"status": new_status, "cid": curriculum_id, "uid": user_id}
    )
    db.commit()
    return {"status": "success", "is_pinned": new_status}

@router.post("/curriculum/{curriculum_id}/archive")
async def archive_curriculum(
    curriculum_id: str,
    user_id: str = Query(...),
    db: Session = Depends(get_session)
):
    # Toggle archive status (or just archive?) User said "move to archive", implying one way, but usually reversible.
    # Logic: Set is_archived = TRUE
    db.execute(
        text("UPDATE curriculums SET is_archived = TRUE WHERE id = :cid AND user_id = :uid"),
        {"cid": curriculum_id, "uid": user_id}
    )
    db.commit()
    return {"status": "success"}

@router.delete("/curriculum/{curriculum_id}")
async def delete_curriculum(
    curriculum_id: str,
    user_id: str = Query(...),
    db: Session = Depends(get_session)
):
    # Delete the curriculum and its modules/subtopics (cascading usually handled by DB, but here explicit might be cleaner if no FK cascade)
    # Assuming FK cascade exists or we basic delete
    
    # First delete related records if not cascading (safer)
    # Actually, let's just try deleting the curriculum.
    db.execute(
        text("DELETE FROM curriculums WHERE id = :cid AND user_id = :uid"),
        {"cid": curriculum_id, "uid": user_id}
    )
    db.commit()
    return {"status": "success"}

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
