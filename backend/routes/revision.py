from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
from services.db_services.db import get_session
from services.Gemini_Services.revision_service import generate_revision_content
import traceback

router = APIRouter(prefix="/api", tags=["Revision"])


class RevisionRequest(BaseModel):
    user_id: str
    curriculum_id: str
    milestone: int


@router.post("/revision/check-milestone")
async def check_revision_milestone(
    user_id: str = Query(...),
    curriculum_id: str = Query(...),
    db: Session = Depends(get_session)
):
    total_subtopics = db.execute(
        text("""
            SELECT COUNT(*) as total
            FROM subtopics s
            JOIN modules m ON s.module_id = m.id
            WHERE m.curriculum_id = :cid
        """),
        {"cid": curriculum_id}
    ).fetchone()
    
    completed_subtopics = db.execute(
        text("""
            SELECT COUNT(*) as completed
            FROM subtopics s
            JOIN modules m ON s.module_id = m.id
            WHERE m.curriculum_id = :cid AND s.score > 0
        """),
        {"cid": curriculum_id}
    ).fetchone()
    
    if not total_subtopics or total_subtopics.total == 0:
        return {"progress": 0, "milestone": None, "ready": False}
    
    progress = (completed_subtopics.completed / total_subtopics.total) * 100
    
    milestones = [25, 50, 75, 100]
    triggered_milestone = None
    
    for m in milestones:
        if progress >= m:
            triggered_milestone = m
    
    return {
        "progress": round(progress, 1),
        "milestone": triggered_milestone,
        "ready": triggered_milestone is not None,
        "total_subtopics": total_subtopics.total,
        "completed_subtopics": completed_subtopics.completed
    }


@router.post("/revision/generate")
async def generate_revision(
    request: RevisionRequest,
    db: Session = Depends(get_session)
):
    try:
        curriculum = db.execute(
            text("SELECT title FROM curriculums WHERE id = :cid"),
            {"cid": request.curriculum_id}
        ).fetchone()
        
        if not curriculum:
            raise HTTPException(status_code=404, detail="Curriculum not found")
        
        all_subtopics = db.execute(
            text("""
                SELECT s.id, s.title, s.content, s.score, m.title as module_title
                FROM subtopics s
                JOIN modules m ON s.module_id = m.id
                WHERE m.curriculum_id = :cid
                ORDER BY s.score ASC, s.position ASC
            """),
            {"cid": request.curriculum_id}
        ).fetchall()
        
        if not all_subtopics:
            raise HTTPException(status_code=404, detail="No subtopics found")
        
        total = len(all_subtopics)
        weak_count = max(3, int(total * 0.3))
        
        weak_topics = [
            {
                "id": str(s.id),
                "title": f"{s.module_title}: {s.title}",
                "content": s.content or "",
                "score": s.score or 0
            }
            for s in all_subtopics[:weak_count]
        ]
        
        print(f"[REVISION] Generating for {len(weak_topics)} weak topics at {request.milestone}% milestone")
        
        revision_content = generate_revision_content(
            weak_topics=weak_topics,
            milestone=request.milestone,
            curriculum_title=curriculum.title
        )
        
        return {
            "milestone": request.milestone,
            "notes": [note.model_dump() for note in revision_content.notes],
            "questions": [q.model_dump() for q in revision_content.questions],
            "weak_topics": [{"id": t["id"], "title": t["title"], "score": t["score"]} for t in weak_topics]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[REVISION] Error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/revision/submit")
async def submit_revision_results(
    user_id: str = Query(...),
    curriculum_id: str = Query(...),
    milestone: int = Query(...),
    score: float = Query(...),
    total_questions: int = Query(...),
    correct_answers: int = Query(...),
    db: Session = Depends(get_session)
):
    return {
        "message": "Revision completed",
        "milestone": milestone,
        "score": score,
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "stored": False
    }
