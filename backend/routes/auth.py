import uuid
from fastapi import APIRouter, HTTPException, status, Depends
import aiosqlite
from config import settings
from auth import hash_password, verify_password, create_access_token, require_admin
from models import UserLogin, UserCreate, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Check default admin shortcut credentials
    if credentials.username == settings.ADMIN_USERNAME and credentials.password == settings.ADMIN_PASSWORD:
        token = create_access_token({"sub": settings.ADMIN_USERNAME, "is_admin": True})
        return TokenResponse(
            access_token=token,
            username=settings.ADMIN_USERNAME,
            is_admin=True,
        )

    async with aiosqlite.connect(settings.DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM users WHERE username = ?", (credentials.username,))
        user = await cursor.fetchone()
        if not user or not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

        token = create_access_token({"sub": user["username"], "is_admin": bool(user["is_admin"])})
        return TokenResponse(
            access_token=token,
            username=user["username"],
            is_admin=bool(user["is_admin"]),
        )

@router.post("/register")
async def register(user: UserCreate, _=Depends(require_admin)):
    async with aiosqlite.connect(settings.DATABASE_PATH) as db:
        cursor = await db.execute("SELECT id FROM users WHERE username = ?", (user.username,))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already registered")

        user_id = str(uuid.uuid4())
        pwd_hash = hash_password(user.password)
        await db.execute(
            "INSERT INTO users (id, username, password_hash, is_admin) VALUES (?, ?, ?, ?)",
            (user_id, user.username, pwd_hash, 1 if user.is_admin else 0)
        )
        await db.commit()

    return {"message": "User registered successfully", "username": user.username}

