import uuid
from fastapi import APIRouter, HTTPException, status, Depends
from config import settings
from database import get_db
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    require_authenticated_user,
)
from models import (
    UserLogin,
    UserCreate,
    TokenResponse,
    UserProfile,
    UserProfileUpdate,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

def user_row_to_profile(row: dict) -> UserProfile:
    return UserProfile(
        id=str(row["id"]),
        username=row["username"],
        name=row.get("name"),
        age=row.get("age"),
        sex=row.get("sex"),
        weight=row.get("weight"),
        height=row.get("height"),
        is_profile_completed=bool(row.get("is_profile_completed", 0)),
        is_admin=bool(row.get("is_admin", 0)),
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    clean_username = credentials.username.strip()

    # Check default admin shortcut credentials
    if clean_username == settings.ADMIN_USERNAME and credentials.password == settings.ADMIN_PASSWORD:
        token = create_access_token({"sub": settings.ADMIN_USERNAME, "is_admin": True})
        admin_profile = UserProfile(
            id="admin_01",
            username=settings.ADMIN_USERNAME,
            name="Administrator",
            is_profile_completed=True,
            is_admin=True,
        )
        return TokenResponse(
            access_token=token,
            username=settings.ADMIN_USERNAME,
            is_admin=True,
            user=admin_profile,
        )

    async with get_db() as cur:
        await cur.execute("SELECT * FROM users WHERE username = %s", (clean_username,))
        user = await cur.fetchone()
        if not user or not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

        token = create_access_token({"sub": user["username"], "is_admin": bool(user["is_admin"])})
        profile = user_row_to_profile(user)
        return TokenResponse(
            access_token=token,
            username=user["username"],
            is_admin=bool(user["is_admin"]),
            user=profile,
        )

@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate):
    clean_username = user.username.strip()
    if not clean_username or len(clean_username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long")
    if not user.password or len(user.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long")

    async with get_db() as cur:
        await cur.execute("SELECT id FROM users WHERE LOWER(username) = LOWER(%s)", (clean_username,))
        if await cur.fetchone():
            raise HTTPException(status_code=400, detail="Username is already taken")

        user_id = str(uuid.uuid4())
        pwd_hash = hash_password(user.password)
        await cur.execute(
            """
            INSERT INTO users (id, username, password_hash, is_admin, is_profile_completed)
            VALUES (%s, %s, %s, %s, 0)
            """,
            (user_id, clean_username, pwd_hash, 1 if user.is_admin else 0)
        )

        # Fetch created user record
        await cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        created_user = await cur.fetchone()

    token = create_access_token({"sub": clean_username, "is_admin": bool(user.is_admin)})
    profile = user_row_to_profile(created_user)

    return TokenResponse(
        access_token=token,
        username=clean_username,
        is_admin=bool(user.is_admin),
        user=profile,
    )

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(auth_user: dict = Depends(require_authenticated_user)):
    username = auth_user["username"]
    if username == settings.ADMIN_USERNAME:
        return UserProfile(
            id="admin_01",
            username=settings.ADMIN_USERNAME,
            name="Administrator",
            is_profile_completed=True,
            is_admin=True,
        )

    async with get_db() as cur:
        await cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = await cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user_row_to_profile(user)

@router.put("/profile", response_model=UserProfile)
async def update_profile(body: UserProfileUpdate, auth_user: dict = Depends(require_authenticated_user)):
    username = auth_user["username"]

    clean_name = body.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    if body.age <= 0 or body.age > 120:
        raise HTTPException(status_code=400, detail="Age must be between 1 and 120")
    if body.weight <= 0 or body.weight > 400:
        raise HTTPException(status_code=400, detail="Weight must be valid (in kg)")
    if body.height <= 0 or body.height > 260:
        raise HTTPException(status_code=400, detail="Height must be valid (in cm)")

    clean_sex = body.sex.strip().lower()
    if clean_sex not in ["male", "female", "other"]:
        clean_sex = "other"

    async with get_db() as cur:
        await cur.execute(
            """
            UPDATE users
            SET name = %s, age = %s, sex = %s, weight = %s, height = %s, is_profile_completed = 1
            WHERE username = %s
            """,
            (clean_name, body.age, clean_sex, float(body.weight), float(body.height), username)
        )

        await cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        updated_user = await cur.fetchone()
        if not updated_user:
            raise HTTPException(status_code=404, detail="User record not found")
        return user_row_to_profile(updated_user)
