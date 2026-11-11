import aiomysql
import pymysql
import logging
import socket
import subprocess
import os
import time
import warnings
from typing import Optional
from contextlib import asynccontextmanager
from config import settings

# Suppress harmless "Table already exists" warnings emitted during CREATE TABLE IF NOT EXISTS
warnings.filterwarnings("ignore", category=pymysql.Warning)
warnings.filterwarnings("ignore", message=".*Table '.*' already exists.*")

logger = logging.getLogger("burnit.db")

_pool: Optional[aiomysql.Pool] = None

def is_mysql_port_open(host: str = "127.0.0.1", port: int = 3306, timeout: float = 0.8) -> bool:
    """Check if the MySQL TCP port is actively listening."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False

def try_start_xampp_mysql() -> bool:
    """If MySQL is not reachable, check common XAMPP paths and attempt to auto-start mysqld."""
    if is_mysql_port_open(settings.DB_HOST, settings.DB_PORT):
        return True

    xampp_candidates = [
        r"C:\xampp\mysql\bin\mysqld.exe",
        r"D:\xampp\mysql\bin\mysqld.exe",
        r"E:\xampp\mysql\bin\mysqld.exe",
    ]

    for exe in xampp_candidates:
        if os.path.exists(exe):
            ini_file = os.path.join(os.path.dirname(exe), "my.ini")
            cmd = [exe]
            if os.path.exists(ini_file):
                cmd.extend([f"--defaults-file={ini_file}", "--standalone"])

            try:
                logger.info(f"Auto-starting XAMPP MySQL daemon: {exe}")
                creation_flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
                subprocess.Popen(
                    cmd,
                    creationflags=creation_flags,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                # Wait up to 3 seconds for port to open
                for _ in range(6):
                    time.sleep(0.5)
                    if is_mysql_port_open(settings.DB_HOST, settings.DB_PORT):
                        logger.info("XAMPP MySQL daemon started successfully.")
                        return True
            except Exception as e:
                logger.debug("Failed to auto-launch XAMPP MySQL: %s", e)
            break

    return is_mysql_port_open(settings.DB_HOST, settings.DB_PORT)

def ensure_database_exists() -> bool:
    """Ensure the target MySQL database exists using synchronous PyMySQL before starting the async pool."""
    try_start_xampp_mysql()
    try:
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=pymysql.Warning)
            conn = pymysql.connect(
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                user=settings.DB_USER,
                password=settings.DB_PASSWORD,
                autocommit=True,
                connect_timeout=3,
            )
            with conn.cursor() as cur:
                cur.execute(
                    f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` "
                    f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
            conn.close()
        logger.info(f"Database `{settings.DB_NAME}` verified in MySQL/XAMPP.")
        return True
    except Exception as e:
        logger.warning(
            f"MySQL connection offline at {settings.DB_HOST}:{settings.DB_PORT} ({e}). "
            "Database features will be disabled until MySQL in XAMPP is started. "
            "(Non-DB features like real-time AI camera tracking, exercise counters, and calorie estimation will continue to work)."
        )
        return False

async def get_pool() -> Optional[aiomysql.Pool]:
    global _pool
    if _pool is None:
        try:
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
                connect_timeout=3,
            )
        except Exception as e:
            logger.debug(f"Could not connect to database pool: {e}")
            _pool = None
    return _pool

async def close_pool():
    global _pool
    if _pool is not None:
        try:
            pool = _pool
            _pool = None
            pool.close()
            await pool.wait_closed()
            logger.info("Database connection pool closed.")
        except Exception as e:
            logger.debug("Error while closing database pool: %s", e)

@asynccontextmanager
async def get_db():
    """Async context manager yielding an aiomysql DictCursor for executing queries."""
    from fastapi import HTTPException, status
    pool = await get_pool()
    if pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is offline. Please ensure MySQL in XAMPP is started.",
        )
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            yield cur

async def init_db():
    if not ensure_database_exists():
        return

    try:
        pool = await get_pool()
        if pool is None:
            return

        with warnings.catch_warnings():
            warnings.filterwarnings("ignore")
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
    except Exception as e:
        logger.warning("Database table check encountered an issue: %s", e)
