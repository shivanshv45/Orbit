from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from uuid import uuid4
from datetime import datetime, timezone

async def user_exist(
        db:AsyncSession,
        user_id : str   ,
        user_name:str
)-> None:
    await db.execute(
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
async def upload_to_db(
        dbstuf: AsyncSession,
        modules: list[list[dict]],
        user_id: str)->str:
    try:
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
            module_title = module[0]["title"]

            await dbstuf.execute(
                text("""
                     INSERT INTO modules (id, user_id, title, position, created_at)
                     VALUES (:id, :user_id, :title, :position, :created_at)
                     """),
                {
                    "id": module_id,
                    "user_id": user_id,
                    "title": module_title,
                    "position": module_pos,
                    "created_at": datetime.now(timezone.utc)
                }
            )

            subtopic_position = 1
            for sub in pending_topics:
                await dbstuf.execute(
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
                        "title": sub["title"],
                        "content": sub["content"],
                        "score": 0,
                        "position": subtopic_position,
                        "created_at": datetime.now(timezone.utc)
                    }
                )
                subtopic_position += 1

        await dbstuf.commit()
        return "success"

    except Exception:
        await dbstuf.rollback()
        raise
