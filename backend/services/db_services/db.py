from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from config import get_settings
settings = get_settings()
engine = create_engine(
 settings.DATABASE_URL,
 poolclass=NullPool
)
SessionLocal = sessionmaker(bind=engine,autocommit=False,autoflush=False)

def get_session():
 db=SessionLocal()
 try:
  yield db

 finally:
  db.close()





