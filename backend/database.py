import aiomysql
import pymysql
import logging
from typing import Optional
from contextlib import asynccontextmanager
from config import settings

logger = logging.getLogger("burnit.db")

_pool: Optional[aiomysql.Pool] = None

def ensure_database_exists():
    """Ensure the target MySQL database exists using synchronous PyMySQL before starting the async pool."""
    try:
        conn = pymysql.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            autocommit=True,
        )
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` "
                f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        conn.close()
        logger.info(f"Database `{settings.DB_NAME}` verified in MySQL/XAMPP.")
    except Exception as e:
        logger.error(f"Error verifying database `{settings.DB_NAME}`: {e}")
        raise

async def get_pool() -> aiomysql.Pool:
    global _pool
    if _pool is None:
        _pool = await aiomysql.create_pool(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            db=settings.DB_NAME,
            autocommit=True,
            charset="utf8mb4",
            cursorclass=aiomysql.DictCursor,
            minsize=1,
            maxsize=10,
        )
    return _pool

async def close_pool():
    global _pool
    if _pool is not None:
        try:
            _pool.close()
            await _pool.wait_closed()
            logger.info("Database connection pool closed.")
        except Exception as e:
            logger.debug("Error while closing database pool: %s", e)
        finally:
            _pool = None

@asynccontextmanager
async def get_db():
    """Async context manager yielding an aiomysql DictCursor for executing queries."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            yield cur

async def init_db():
    ensure_database_exists()
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            # 1. Users Table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(64) PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    is_admin TINYINT(1) DEFAULT 0,
                    name VARCHAR(150) DEFAULT NULL,
                    age INT DEFAULT NULL,
                    sex VARCHAR(20) DEFAULT NULL,
                    weight DOUBLE DEFAULT NULL,
                    height DOUBLE DEFAULT NULL,
                    is_profile_completed TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

            # 2. Workout Sessions Table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id VARCHAR(64) PRIMARY KEY,
                    user_id VARCHAR(100) DEFAULT NULL,
                    exercise VARCHAR(64) NOT NULL,
                    start_time VARCHAR(64) DEFAULT NULL,
                    end_time VARCHAR(64) DEFAULT NULL,
                    total_reps INT DEFAULT 0,
                    avg_form_score DOUBLE DEFAULT 0.0,
                    duration_seconds DOUBLE DEFAULT 0.0,
                    calories DOUBLE DEFAULT 0.0,
                    common_errors TEXT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

            # 3. Dataset Metadata Table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS dataset_metadata (
                    id VARCHAR(64) PRIMARY KEY,
                    exercise VARCHAR(64) NOT NULL,
                    phase VARCHAR(64) DEFAULT NULL,
                    form_label VARCHAR(64) DEFAULT NULL,
                    error_type VARCHAR(64) DEFAULT NULL,
                    subject_id VARCHAR(64) DEFAULT NULL,
                    camera_view VARCHAR(64) DEFAULT NULL,
                    frame_count INT DEFAULT 0,
                    csv_path VARCHAR(255) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

    logger.info("MySQL tables initialized successfully in phpMyAdmin database: %s", settings.DB_NAME)
