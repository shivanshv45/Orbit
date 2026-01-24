from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from services.db_services.db import get_session

router = APIRouter(prefix="/api", tags=["Users"])

class CreateUserRequest(BaseModel):
    id: str
    name: str

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
