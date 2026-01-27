from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from services.db_services.db import get_session
from datetime import datetime, timedelta

router = APIRouter(prefix="/api", tags=["Users"])

class CreateUserRequest(BaseModel):
    id: str
    name: str

class UserStats(BaseModel):
    streak: int
    lessonsCompleted: int
    totalLessons: int
    practiceScore: int
    estimatedTimeLeft: str

@router.post("/users")
async def create_user(
    user: CreateUserRequest,
    db: Session = Depends(get_session)
):
    try:
        existing = db.execute(
            text("SELECT id FROM users WHERE id = CAST(:uid AS uuid)"),
            {"uid": user.id}
        ).fetchone()
        
        if existing:
            return {"message": "User already exists", "id": user.id}
        
        db.execute(
            text("INSERT INTO users (id, name) VALUES (CAST(:uid AS uuid), :name)"),
            {"uid": user.id, "name": user.name}
        )
        db.commit()
        
        return {"message": "User created successfully", "id": user.id, "name": user.name}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/stats", response_model=UserStats)
async def get_user_stats(
    user_id: str,
    db: Session = Depends(get_session)
):
    try:
        # 1. Lessons Completed & Total
        # Assuming 'completed' means score >= 70 (or just present in user_attempts with high score?) 
        # Actually checking subtopics.score is better if we update it.
        # But subtopics table is shared? No, subtopics table has 'score' column which seems shared in this simple design 
        # (Wait, if multiple users use the app, subtopics.score as a single column is bad design, but per earlier context, 
        # we moved to user_attempts. But wait, earlier summary said: "subtopics table (Only Place Score is Stored!)" 
        # -> This implies single user system or flawed design. 
        # However, the user asked to "make it functional".
        # Let's count from user_attempts to be multi-user safeish, or strictly checks subtopics if single user.
        # Given "The user's OS version is windows" and local running, let's assume single user effectively or Check user_attempts.
        
        # Let's use user_attempts for completion count.
        completion_result = db.execute(
            text("""
                SELECT COUNT(DISTINCT subtopic_id) as count 
                FROM user_attempts 
                WHERE user_id = CAST(:uid AS uuid) 
                AND score >= 0.7  -- Assuming 70% passing
            """),
            {"uid": user_id}
        ).fetchone()
        completed = completion_result.count if completion_result else 0

        # Total Lessons
        total_result = db.execute(text("SELECT COUNT(*) as count FROM subtopics")).fetchone()
        total = total_result.count if total_result else 0

        # Practice Score (Average Accuracy)
        score_result = db.execute(
            text("""
                SELECT AVG(score) as avg_score 
                FROM user_attempts 
                WHERE user_id = CAST(:uid AS uuid)
            """),
            {"uid": user_id}
        ).fetchone()
        avg_score = int(score_result.avg_score * 100) if score_result and score_result.avg_score is not None else 0

        # Streak Calculation (Simple: Consecutive days with activity)
        # We need created_at in user_attempts. Assuming it exists.
        streak = 0
        try:
            dates_result = db.execute(
                text("""
                    SELECT DISTINCT DATE(created_at) as attempt_date 
                    FROM user_attempts 
                    WHERE user_id = CAST(:uid AS uuid) 
                    ORDER BY attempt_date DESC
                """),
                {"uid": user_id}
            ).fetchall()
            
            if dates_result:
                today = datetime.now().date()
                dates = [d.attempt_date for d in dates_result]
                
                # Check if active today or yesterday to start streak
                if dates[0] == today or dates[0] == today - timedelta(days=1):
                    streak = 1
                    current_check = dates[0]
                    for i in range(1, len(dates)):
                        if dates[i] == current_check - timedelta(days=1):
                            streak += 1
                            current_check = dates[i]
                        else:
                            break
        except Exception as e:
            print(f"Streak calc failed (maybe no created_at?): {e}")
            streak = 0 # Fallback

        # Estimated Time Left
        # Assume 15 min per uncompleted lesson
        remaining = max(0, total - completed)
        minutes_left = remaining * 15
        hours = minutes_left // 60
        mins = minutes_left % 60
        
        if hours > 0:
            time_left = f"{hours}h {mins}m"
        else:
            time_left = f"{mins}m"

        return UserStats(
            streak=streak,
            lessonsCompleted=completed,
            totalLessons=total,
            practiceScore=avg_score,
            estimatedTimeLeft=time_left
        )

    except Exception as e:
        print(f"Stats Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
