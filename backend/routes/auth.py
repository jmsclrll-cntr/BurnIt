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
        async with get_db() as cur:
            await cur.execute("SELECT * FROM users WHERE username = %s", (clean_username,))
            admin_user = await cur.fetchone()
            if not admin_user:
                admin_id = "admin_01"
                pwd_hash = hash_password(settings.ADMIN_PASSWORD)
                await cur.execute("""
                    INSERT INTO users (id, username, password_hash, is_admin, name, is_profile_completed)
                    VALUES (%s, %s, %s, 1, 'Administrator', 1)
                """, (admin_id, clean_username, pwd_hash))
                await cur.execute("SELECT * FROM users WHERE id = %s", (admin_id,))
                admin_user = await cur.fetchone()

        token = create_access_token({"sub": settings.ADMIN_USERNAME, "is_admin": True})
        profile = user_row_to_profile(admin_user)
        return TokenResponse(
            access_token=token,
            username=settings.ADMIN_USERNAME,
            is_admin=True,
            user=profile,
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

    async with get_db() as cur:
        await cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = await cur.fetchone()
        if not user and username == settings.ADMIN_USERNAME:
            admin_id = "admin_01"
            pwd_hash = hash_password(settings.ADMIN_PASSWORD)
            await cur.execute("""
                INSERT INTO users (id, username, password_hash, is_admin, name, is_profile_completed)
                VALUES (%s, %s, %s, 1, 'Administrator', 1)
            """, (admin_id, username, pwd_hash))
            await cur.execute("SELECT * FROM users WHERE id = %s", (admin_id,))
            user = await cur.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user_row_to_profile(user)

@router.put("/profile", response_model=UserProfile)
async def update_profile(body: UserProfileUpdate, auth_user: dict = Depends(require_authenticated_user)):
    username = auth_user["username"]

    if body.age is None or body.age < 10 or body.age > 100:
        raise HTTPException(status_code=400, detail="Enter an age between 10 and 100.")

    if body.weight is None or body.weight < 20 or body.weight > 300:
        raise HTTPException(status_code=400, detail="Enter a weight between 20 and 300 kg.")

    if body.height is None or body.height < 100 or body.height > 250:
        raise HTTPException(status_code=400, detail="Enter a height between 100 and 250 cm.")

    raw_sex = (body.sex or "").strip()
    clean_sex = None
    for valid_gender in ["Male", "Female", "Other"]:
        if raw_sex.lower() == valid_gender.lower():
            clean_sex = valid_gender
            break
    if not clean_sex:
        raise HTTPException(status_code=400, detail="Select gender: Male, Female, or Other.")

    async with get_db() as cur:
        await cur.execute("SELECT name FROM users WHERE username = %s", (username,))
        existing_user = await cur.fetchone()
        if not existing_user and username == settings.ADMIN_USERNAME:
            admin_id = "admin_01"
            pwd_hash = hash_password(settings.ADMIN_PASSWORD)
            await cur.execute("""
                INSERT INTO users (id, username, password_hash, is_admin, name, is_profile_completed)
                VALUES (%s, %s, %s, 1, 'Administrator', 1)
            """, (admin_id, username, pwd_hash))
            existing_user = {"name": "Administrator"}
        elif not existing_user:
            raise HTTPException(status_code=404, detail="User record not found")

        current_name = existing_user.get("name") or username
        clean_name = body.name.strip() if (body.name and body.name.strip()) else current_name

        await cur.execute(
            """
            UPDATE users
            SET name = %s, age = %s, sex = %s, weight = %s, height = %s, is_profile_completed = 1
            WHERE username = %s
            """,
            (clean_name, int(body.age), clean_sex, float(body.weight), float(body.height), username)
        )

        await cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        updated_user = await cur.fetchone()
        return user_row_to_profile(updated_user)
