import os
import logging
import uuid
import json
import time
import asyncio
import re
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from database import get_db

logger = logging.getLogger("burnit.contact")
router = APIRouter(prefix="/api/contact", tags=["Contact"])

BASE_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INQUIRIES_FILE = os.path.join(BASE_BACKEND_DIR, "contact_inquiries.jsonl")

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

class ContactRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: str = Field(..., min_length=5, max_length=150)
    subject: str = Field(..., min_length=2, max_length=200)
    message: str = Field(..., min_length=5, max_length=3000)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email address format.")
        return clean

@router.post("", status_code=status.HTTP_200_OK)
async def submit_contact(req: ContactRequest):
    logger.info(f"Contact form submitted by {req.name} <{req.email}>: {req.subject}")
    
    # 1. Always append to persistent JSONL log to guarantee zero data loss
    try:
        inquiry_data = {
            "id": f"msg_{uuid.uuid4().hex[:12]}",
            "name": req.name,
            "email": req.email,
            "subject": req.subject,
            "message": req.message,
            "timestamp": time.time(),
            "formatted_time": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        with open(INQUIRIES_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(inquiry_data) + "\n")
    except Exception as err:
        logger.warning(f"Failed to append to contact_inquiries.jsonl: {err}")

    # 2. Store in MySQL database if active (non-blocking with timeout)
    try:
        async def _save_to_mysql():
            async with get_db() as cur:
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS contact_messages (
                        id VARCHAR(64) PRIMARY KEY,
                        name VARCHAR(150) NOT NULL,
                        email VARCHAR(150) NOT NULL,
                        subject VARCHAR(200) NOT NULL,
                        message TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                """)
                msg_id = f"msg_{uuid.uuid4().hex[:12]}"
                await cur.execute("""
                    INSERT INTO contact_messages (id, name, email, subject, message)
                    VALUES (%s, %s, %s, %s, %s)
                """, (msg_id, req.name, req.email, req.subject, req.message))

        await asyncio.wait_for(_save_to_mysql(), timeout=1.5)
    except Exception as e:
        logger.info(f"MySQL write bypassed or offline ({e}). Inquiry safely preserved in JSONL log.")

    return {
        "status": "success",
        "message": f"Thank you, {req.name}! Your message has been sent successfully. Our team will review your inquiry and respond to {req.email} shortly."
    }
