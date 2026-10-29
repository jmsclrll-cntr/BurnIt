import aiosqlite
import json
import logging
from config import settings

logger = logging.getLogger("burnit.db")

async def get_db():
    db = await aiosqlite.connect(settings.DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()

async def init_db():
    async with aiosqlite.connect(settings.DATABASE_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                is_admin INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                exercise TEXT NOT NULL,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                total_reps INTEGER DEFAULT 0,
                avg_form_score REAL DEFAULT 0.0,
                duration_seconds REAL DEFAULT 0.0,
                calories REAL DEFAULT 0.0,
                common_errors TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS dataset_metadata (
                id TEXT PRIMARY KEY,
                exercise TEXT NOT NULL,
                phase TEXT,
                form_label TEXT,
                error_type TEXT,
                subject_id TEXT,
                camera_view TEXT,
                frame_count INTEGER DEFAULT 0,
                csv_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()
    logger.info("Database schema initialized successfully.")
