from sqlalchemy import create_engine, text
import os

# Hardcoded from .env since I'm running this as a script
DATABASE_URL = "postgresql://neondb_owner:npg_lQBkZA7V2Mzc@ep-solitary-king-a1g5x32e-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        # Check if columns exist first to be safe (though IF NOT EXISTS handles it in postgres usually)
        print("Checking columns...")
        
        # Add is_pinned
        try:
            connection.execute(text("ALTER TABLE curriculums ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;"))
            print("Added is_pinned")
        except Exception as e:
            print(f"Error adding is_pinned: {e}")

        # Add is_archived
        try:
            connection.execute(text("ALTER TABLE curriculums ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;"))
            print("Added is_archived")
        except Exception as e:
            print(f"Error adding is_archived: {e}")
            
        connection.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
