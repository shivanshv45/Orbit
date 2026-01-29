from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from services.db_services.db import get_session
import traceback

router = APIRouter(prefix="/api", tags=["Camera"])

class CameraMetrics(BaseModel):
    user_id: str
    subtopic_id: str
    session_duration: int
    focus_score: float
    confusion_level: float
    fatigue_score: float
    engagement: float
    frustration: float
    blink_rate: float
    head_stability: float
    engagement_score: float

@router.post("/camera/metrics")
async def submit_camera_metrics(
    data: CameraMetrics,
    db: Session = Depends(get_session)
):

    try:
        # Insert metrics
        db.execute(
            text("""
                INSERT INTO camera_metrics (
                    user_id, subtopic_id, session_duration,
                    focus_score, confusion_level, fatigue_score,
                    engagement, frustration, blink_rate,
                    head_stability, engagement_score
                ) VALUES (
                    :user_id, :subtopic_id, :session_duration,
                    :focus_score, :confusion_level, :fatigue_score,
                    :engagement, :frustration, :blink_rate,
                    :head_stability, :engagement_score
                )
            """),
            {
                "user_id": data.user_id,
                "subtopic_id": data.subtopic_id,
                "session_duration": data.session_duration,
                "focus_score": data.focus_score,
                "confusion_level": data.confusion_level,
                "fatigue_score": data.fatigue_score,
                "engagement": data.engagement,
                "frustration": data.frustration,
                "blink_rate": data.blink_rate,
                "head_stability": data.head_stability,
                "engagement_score": data.engagement_score
            }
        )
        db.commit()
        

        update_subtopic_score_with_camera(db, data.subtopic_id)
        
        return {
            "success": True,
            "engagement_score": data.engagement_score
        }
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to save camera metrics: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


def update_subtopic_score_with_camera(db: Session, subtopic_id: str):


    question_result = db.execute(
        text("""
            SELECT AVG(score) * 100 as avg_score
            FROM user_attempts
            WHERE subtopic_id = :sid
        """),
        {"sid": subtopic_id}
    ).fetchone()
    
    question_score = question_result.avg_score if question_result and question_result.avg_score else 0
    

    camera_result = db.execute(
        text("""
            SELECT AVG(engagement_score) as avg_engagement
            FROM camera_metrics
            WHERE subtopic_id = :sid
        """),
        {"sid": subtopic_id}
    ).fetchone()
    
    camera_score = camera_result.avg_engagement if camera_result and camera_result.avg_engagement else 0
    
    # Calculate Final Score
    # If no questions attempted, use 100% camera score
    # If no camera data, use 100% question score
    # If both, use weighted average (70% Q, 30% C)
    
    if question_result and question_result.avg_score is not None:
        # Questions exist
        if camera_result and camera_result.avg_engagement:
             # Both exist -> Weighted
             final_score = int((question_score * 0.7) + (camera_score * 0.3))
        else:
             # Only questions -> 100% Q
             final_score = int(question_score)
    else:
        # No questions attempted yet
        if camera_result and camera_result.avg_engagement:
            # Only camera -> 100% C
            final_score = int(camera_score)
        else:
            # Nothing -> 0
            final_score = 0

    db.execute(
        text("UPDATE subtopics SET score = :score WHERE id = :sid"),
        {"score": final_score, "sid": subtopic_id}
    )
    db.commit()
    
    print(f"[INFO] Updated subtopic {subtopic_id}: Q={question_score:.1f}, C={camera_score:.1f}, Final={final_score}")


@router.get("/camera/stats/{subtopic_id}")
async def get_camera_stats(
    subtopic_id: str,
    db: Session = Depends(get_session)
):

    stats = db.execute(
        text("""
            SELECT 
                COUNT(*) as session_count,
                AVG(session_duration) as avg_duration,
                AVG(focus_score) as avg_focus,
                AVG(confusion_level) as avg_confusion,
                AVG(fatigue_score) as avg_fatigue,
                AVG(engagement) as avg_engagement,
                AVG(frustration) as avg_frustration,
                AVG(engagement_score) as avg_engagement_score
            FROM camera_metrics
            WHERE subtopic_id = :sid
        """),
        {"sid": subtopic_id}
    ).fetchone()
    
    if not stats or stats.session_count == 0:
        return {"message": "No camera data for this subtopic"}
    
    return {
        "session_count": stats.session_count,
        "avg_duration_seconds": round(stats.avg_duration, 1),
        "metrics": {
            "focus": round(stats.avg_focus, 1),
            "confusion": round(stats.avg_confusion, 1),
            "fatigue": round(stats.avg_fatigue, 1),
            "engagement": round(stats.avg_engagement, 1),
            "frustration": round(stats.avg_frustration, 1),
        },
        "final_engagement_score": round(stats.avg_engagement_score, 1)
    }
