import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Reliably locate project directories regardless of where uvicorn is executed from
CURRENT_FILE_DIR = os.path.dirname(os.path.abspath(__file__)) # backend/app/database
APP_DIR = os.path.dirname(CURRENT_FILE_DIR)                  # backend/app
BACKEND_DIR = os.path.dirname(APP_DIR)                       # backend
PROJECT_ROOT = os.path.dirname(BACKEND_DIR) if os.path.basename(BACKEND_DIR) == "backend" else BACKEND_DIR

# Load .env from project root or backend
env_locations = [
    os.path.join(PROJECT_ROOT, ".env"),
    os.path.join(BACKEND_DIR, ".env"),
    os.path.join(os.getcwd(), ".env")
]
for env_path in env_locations:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        break

# Canonical SQLite database file in the project root
CANONICAL_DB_FILE = os.path.join(PROJECT_ROOT, "muletrace.db")
SQLITE_CANONICAL_URL = f"sqlite:///{CANONICAL_DB_FILE.replace(os.sep, '/')}"

ENV_DATABASE_URL = os.getenv("DATABASE_URL", "")
SQLITE_FALLBACK_URL = os.getenv("SQLITE_FALLBACK_URL", SQLITE_CANONICAL_URL)

engine = None
SessionLocal = None

def init_db_engine():
    global engine, SessionLocal
    if engine is not None and SessionLocal is not None:
        return engine, SessionLocal

    chosen_engine = None

    # Try PostgreSQL first if explicitly configured in DATABASE_URL
    if "postgresql" in ENV_DATABASE_URL:
        try:
            test_engine = create_engine(
                ENV_DATABASE_URL,
                pool_pre_ping=True,
                connect_args={"connect_timeout": 3}
            )
            with test_engine.connect() as conn:
                pass
            chosen_engine = test_engine
            print(f"[MULETRACE-DB] Connected to PostgreSQL successfully at: {ENV_DATABASE_URL.split('@')[-1]}")
        except Exception as e:
            print(f"[MULETRACE-DB] PostgreSQL connection to '{ENV_DATABASE_URL}' failed ({type(e).__name__}). Falling back to canonical SQLite database.")
            chosen_engine = None

    # Fall back to canonical SQLite database
    if chosen_engine is None:
        chosen_engine = create_engine(SQLITE_CANONICAL_URL, connect_args={"check_same_thread": False})
        print(f"[MULETRACE-DB] Using persistent SQLite database at: {CANONICAL_DB_FILE}")

    engine = chosen_engine
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, SessionLocal

# Initialize on import
engine, SessionLocal = init_db_engine()

Base = declarative_base()

def get_engine():
    global engine, SessionLocal
    if engine is None:
        engine, SessionLocal = init_db_engine()
    return engine

def get_db():
    global SessionLocal
    if SessionLocal is None:
        _, SessionLocal = init_db_engine()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
