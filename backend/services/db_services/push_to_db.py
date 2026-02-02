from sqlalchemy.orm import Session
from sqlalchemy import text
from uuid import uuid4
from datetime import datetime, timezone
import re

def sanitize_title(title: str) -> str:
    if not title: return ""
    title = re.sub(r'^\s*[\d.]+\s+', '', title)
    title = re.sub(r'[^a-zA-Z0-9\s\-]', '', title)
    return title.strip()

def user_exist(
        db:Session,
        user_id : str,
        user_name:str
)-> None:
    db.execute(
        text("""
             INSERT INTO users (id, name, created_at)
             VALUES (:id, :name, :created_at)
                 ON CONFLICT (id) DO NOTHING
             """),
        {
            "id": user_id,
            "name": user_name,
            "created_at": datetime.now(timezone.utc)
        }
    )

def upload_to_db(
        dbstuf: Session,
        modules: list[list[dict]],
        user_id: str,
        curriculum_title: str)->str:
    try:
        curriculum_id = str(uuid4())
        
        dbstuf.execute(
            text("""
                INSERT INTO curriculums (id, user_id, title, created_at)
                VALUES (:id, :user_id, :title, :created_at)
            """),
            {
                "id": curriculum_id,
                "user_id": user_id,
                "title": curriculum_title,
                "created_at": datetime.now(timezone.utc)
            }
        )

        for module_pos, module in enumerate(modules, start=1):
            buffer_content = ""
            buffer_title = None
            module_has_valid_content = False
            pending_topics = []

            for subtopic in module:
                content = subtopic["content"].strip()
                if len(content) < 10:
                    continue

                if not buffer_content:
                    buffer_title = subtopic["title"]
                    buffer_content = content
                else:
                    buffer_content += " " + content

                if len(buffer_content) >= 80:
                    pending_topics.append({
                        "title": buffer_title,
                        "content": buffer_content
                    })
                    module_has_valid_content = True
                    buffer_content = ""
                    buffer_title = None

            if not module_has_valid_content:
                continue

            module_id = str(uuid4())
            module_title = sanitize_title(module[0]["title"])

            dbstuf.execute(
                text("""
                     INSERT INTO modules (id, curriculum_id, title, position, created_at)
                     VALUES (:id, :curriculum_id, :title, :position, :created_at)
                     """),
                {
                    "id": module_id,
                    "curriculum_id": curriculum_id,
                    "title": module_title,
                    "position": module_pos,
                    "created_at": datetime.now(timezone.utc)
                }
            )

            subtopic_position = 1
            for sub in pending_topics:
                dbstuf.execute(
                    text("""
                         INSERT INTO subtopics (
                             id, module_id, title, content,
                             score, position, created_at
                         )
                         VALUES (
                                    :id, :module_id, :title, :content,
                                    :score, :position, :created_at
                                )
                         """),
                    {
                        "id": str(uuid4()),
                        "module_id": module_id,
                        "title": sanitize_title(sub["title"]),
                        "content": sub["content"],
                        "score": 0,
                        "position": subtopic_position,
                        "created_at": datetime.now(timezone.utc)
                    }
                )
                subtopic_position += 1

        dbstuf.commit()
        return curriculum_id

    except Exception:
        dbstuf.rollback()
        raise
