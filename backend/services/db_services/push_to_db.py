from sqlalchemy import text
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .db import SessionLocal


#session comes form db.py with the Sessionmaker
def upload_to_db(dbstuf: Session):
    user_id = uuid4()
    module_id = uuid4()
    subtopic_id = uuid4()

    dbstuf.execute(
        text("""
            INSERT INTO users (id, name, created_at)
            VALUES (:id, :name, :created_at)
        """),
        {
            "id": user_id,
            "name": "Mock User",
            "created_at": datetime.now(timezone.utc)
        }
    )

    dbstuf.execute(
        text("""
            INSERT INTO modules (id, user_id, title, position, created_at)
            VALUES (:id, :user_id, :title, :position, :created_at)
        """),
        {
            "id": module_id,
            "user_id": user_id,
            "title": "Mock Module Title",
            "position": 1,
            "created_at": datetime.now(timezone.utc)
        }
    )

    dbstuf.execute(
        text("""
            INSERT INTO subtopics (id, module_id, title, content, score, position, created_at)
            VALUES (:id, :module_id, :title, :content, :score, :position, :created_at)
        """),
        {
            "id": subtopic_id,
            "module_id": module_id,
            "title": "Mock Subtopic Title",
            "content": "This is mock content inserted using db.execute(text(...)).",
            "score": 0,
            "position": 1,
            "created_at": datetime.now(timezone.utc)
        }
    )

    dbstuf.commit()


if __name__ == "__main__":
    db = SessionLocal()
    try:
        upload_to_db(db)
    finally:
        db.close()
