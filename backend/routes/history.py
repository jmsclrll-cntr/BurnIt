import json
import uuid
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field

from database import get_db
from auth import require_authenticated_user

router = APIRouter(prefix="/api/history", tags=["history"])

ALLOWED_EXERCISES = {
    "Auto-detect",
    "Squats",
    "Push-ups",
    "Plank",
    "Jumping jacks",
    "Bicep curls",
}

CANONICAL_EXERCISE_MAP = {
    "auto": "Auto-detect",
    "auto-detect": "Auto-detect",
    "squat": "Squats",
    "squats": "Squats",
    "pushup": "Push-ups",
    "pushups": "Push-ups",
    "push-ups": "Push-ups",
    "push-up": "Push-ups",
    "plank": "Plank",
    "planks": "Plank",
    "plank hold": "Plank",
    "jumpingjack": "Jumping jacks",
    "jumpingjacks": "Jumping jacks",
    "jumping jacks": "Jumping jacks",
    "bicepcurl": "Bicep curls",
    "bicepcurls": "Bicep curls",
    "bicep curls": "Bicep curls",
}

def normalize_exercise_name(name: str) -> str:
    cleaned = (name or "").strip()
    if cleaned in ALLOWED_EXERCISES:
        return cleaned
    lower = cleaned.lower()
    if lower in CANONICAL_EXERCISE_MAP:
        return CANONICAL_EXERCISE_MAP[lower]
    # Check title case
    for allowed in ALLOWED_EXERCISES:
        if allowed.lower() == lower:
            return allowed
    return cleaned

class WorkoutHistoryItemCreate(BaseModel):
    id: Optional[str] = None
    exercise_name: str
    duration_seconds: int
    reps: int = 0
    calories_burned: float = 0.0
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    avg_form_score: Optional[float] = None
    common_errors: Optional[Any] = None
    avg_heart_rate: Optional[int] = None
    date: Optional[str] = None

def format_duration(seconds: int) -> str:
    secs = max(0, int(seconds or 0))
    m = secs // 60
    s = secs % 60
    return f"{m}:{s:02d}"

def get_day_label(target_date: date, today: date) -> str:
    diff = (today - target_date).days
    if diff == 0:
        return "Today"
    elif diff == 1:
        return "Yesterday"
    else:
        # e.g. "Tue, Nov 10"
        return target_date.strftime("%a, %b %d").replace(" 0", " ")

@router.get("")
async def get_workout_history(auth_user: dict = Depends(require_authenticated_user)):
    username = auth_user["username"]
    today = date.today()

    async with get_db() as cur:
        await cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        user_row = await cur.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = str(user_row["id"])

        # Fetch workouts from workout_history_items
        await cur.execute(
            """
            SELECT 
                whi.id,
                wh.user_id,
                whi.exercise_name,
                whi.start_time,
                whi.duration_seconds,
                whi.reps,
                whi.calories_burned,
                wh.date AS workout_date,
                whi.created_at
            FROM workout_history_items whi
            JOIN workout_history wh ON whi.history_id = wh.id
            WHERE wh.user_id = %s
            ORDER BY whi.created_at DESC
            """,
            (user_id,)
        )
        whi_rows = await cur.fetchall()

        # Fetch sessions from table sessions
        await cur.execute(
            """
            SELECT 
                id,
                user_id,
                exercise AS exercise_name,
                start_time,
                duration_seconds,
                total_reps AS reps,
                calories AS calories_burned,
                DATE(created_at) AS workout_date,
                created_at
            FROM sessions
            WHERE user_id = %s OR user_id = %s
            ORDER BY created_at DESC
            """,
            (username, user_id)
        )
        sess_rows = await cur.fetchall()

    # Combine & deduplicate by workout id
    all_workouts: Dict[str, dict] = {}
    for row in whi_rows:
        row_id = str(row["id"])
        w_date = row["workout_date"]
        d_str = w_date.isoformat() if hasattr(w_date, "isoformat") else str(w_date)
        dur = int(row["duration_seconds"] or 0)
        all_workouts[row_id] = {
            "id": row_id,
            "exercise_name": normalize_exercise_name(row["exercise_name"]),
            "start_time": row["start_time"] or "",
            "duration_seconds": dur,
            "duration_formatted": format_duration(dur),
            "reps": int(row["reps"] or 0),
            "calories_burned": round(float(row["calories_burned"] or 0)),
            "date": d_str,
            "created_at": str(row["created_at"]),
        }

    for row in sess_rows:
        row_id = str(row["id"])
        if row_id not in all_workouts:
            w_date = row["workout_date"]
            d_str = w_date.isoformat() if hasattr(w_date, "isoformat") else str(w_date)
            dur_val = int(round(float(row["duration_seconds"] or 0)))
            cal_val = round(float(row["calories_burned"] or 0))
            all_workouts[row_id] = {
                "id": row_id,
                "exercise_name": normalize_exercise_name(row["exercise_name"]),
                "start_time": row["start_time"] or "",
                "duration_seconds": dur_val,
                "duration_formatted": format_duration(dur_val),
                "reps": int(row["reps"] or 0),
                "calories_burned": cal_val,
                "date": d_str,
                "created_at": str(row["created_at"]),
            }

    # Calculate overall user summary
    total_workouts = len(all_workouts)
    total_seconds = sum(w["duration_seconds"] for w in all_workouts.values())
    total_minutes = round(total_seconds / 60)
    total_kcal = round(sum(w["calories_burned"] for w in all_workouts.values()))

    # Group workouts by date
    grouped_by_date: Dict[str, List[dict]] = {}
    for w in all_workouts.values():
        grouped_by_date.setdefault(w["date"], []).append(w)

    # Only include days that actually exist in the database (newest first)
    days_list = []
    for cur_date_str in sorted(grouped_by_date.keys(), reverse=True):
        day_workouts = grouped_by_date[cur_date_str]
        if not day_workouts:
            continue
        try:
            cur_date = datetime.strptime(cur_date_str, "%Y-%m-%d").date()
        except ValueError:
            continue

        day_label = get_day_label(cur_date, today)
        formatted_sub = cur_date.strftime("%a, %b %d").replace(" 0", " ")

        count = len(day_workouts)
        dur_secs = sum(w["duration_seconds"] for w in day_workouts)
        dur_min = round(dur_secs / 60)
        cal = round(sum(w["calories_burned"] for w in day_workouts))

        day_workouts_sorted = sorted(
            day_workouts,
            key=lambda it: str(it.get("created_at") or it.get("start_time") or ""),
            reverse=True
        )

        days_list.append({
            "history_id": cur_date_str,
            "date": cur_date_str,
            "title": day_label,
            "subtitle": f"{formatted_sub} · {count} {'workout' if count == 1 else 'workouts'}",
            "workouts": count,
            "minutes": dur_min,
            "kcal": cal,
            "is_rest_day": False,
            "items": day_workouts_sorted,
        })

    workouts_list = sorted(
        all_workouts.values(),
        key=lambda it: str(it.get("created_at") or it.get("date") or ""),
        reverse=True
    )

    return {
        "summary": {
            "workouts": total_workouts,
            "minutes": total_minutes,
            "kcal": total_kcal,
        },
        "days": days_list,
        "workouts": workouts_list,
    }

@router.get("/day/{target_date}")
async def get_day_details(target_date: str, auth_user: dict = Depends(require_authenticated_user)):
    username = auth_user["username"]
    today = date.today()

    try:
        parsed_date = datetime.strptime(target_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    async with get_db() as cur:
        await cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        user_row = await cur.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = str(user_row["id"])

        # 1. Fetch from workout_history_items for that date
        await cur.execute(
            """
            SELECT whi.id, whi.exercise_name, whi.start_time, whi.duration_seconds, whi.reps, whi.calories_burned, whi.created_at
            FROM workout_history_items whi
            JOIN workout_history wh ON whi.history_id = wh.id
            WHERE wh.user_id = %s AND wh.date = %s
            ORDER BY whi.created_at ASC
            """,
            (user_id, parsed_date)
        )
        whi_items = await cur.fetchall()

        # 2. Fetch from sessions for that date
        await cur.execute(
            """
            SELECT id, exercise AS exercise_name, start_time, duration_seconds, total_reps AS reps, calories AS calories_burned, created_at
            FROM sessions
            WHERE (user_id = %s OR user_id = %s) AND DATE(created_at) = %s
            ORDER BY created_at ASC
            """,
            (username, user_id, parsed_date)
        )
        sess_items = await cur.fetchall()

    # Deduplicate items by ID
    day_items_map = {}
    for row in whi_items:
        r_id = str(row["id"])
        dur = int(row["duration_seconds"] or 0)
        day_items_map[r_id] = {
            "id": r_id,
            "exercise_name": row["exercise_name"],
            "start_time": row["start_time"],
            "duration_seconds": dur,
            "duration_formatted": format_duration(dur),
            "reps": int(row["reps"] or 0),
            "calories_burned": round(float(row["calories_burned"] or 0)),
        }

    for row in sess_items:
        r_id = str(row["id"])
        if r_id not in day_items_map:
            dur = int(round(float(row["duration_seconds"] or 0)))
            day_items_map[r_id] = {
                "id": r_id,
                "exercise_name": normalize_exercise_name(row["exercise_name"]),
                "start_time": row["start_time"] or "",
                "duration_seconds": dur,
                "duration_formatted": format_duration(dur),
                "reps": int(row["reps"] or 0),
                "calories_burned": round(float(row["calories_burned"] or 0)),
            }

    items = list(day_items_map.values())
    day_label = get_day_label(parsed_date, today)
    formatted_sub = parsed_date.strftime("%a, %b %d").replace(" 0", " ")
    total_workouts = len(items)
    total_minutes = round(sum(it["duration_seconds"] for it in items) / 60)
    total_kcal = sum(it["calories_burned"] for it in items)

    subtitle = f"{formatted_sub} · {total_workouts} {'workout' if total_workouts == 1 else 'workouts'} · {total_minutes} min · {total_kcal} kcal"

    return {
        "date": target_date,
        "title": day_label,
        "subtitle": subtitle,
        "total_workouts": total_workouts,
        "total_minutes": total_minutes,
        "total_kcal": total_kcal,
        "items": items,
    }

@router.post("/item")
async def save_workout_item(payload: WorkoutHistoryItemCreate, auth_user: dict = Depends(require_authenticated_user)):
    username = auth_user["username"]

    # 1. Server-side validation
    norm_exercise = normalize_exercise_name(payload.exercise_name)
    if norm_exercise not in ALLOWED_EXERCISES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid exercise name '{payload.exercise_name}'. Allowed: {', '.join(sorted(ALLOWED_EXERCISES))}"
        )

    if payload.duration_seconds <= 0:
        raise HTTPException(status_code=400, detail="Duration must be a positive whole number of seconds.")

    if payload.reps < 0:
        raise HTTPException(status_code=400, detail="Reps must be a whole number of 0 or more.")

    if payload.calories_burned < 0:
        raise HTTPException(status_code=400, detail="Calories must be 0 or more.")

    # Determine date
    if payload.date:
        try:
            target_date = datetime.strptime(payload.date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")
    else:
        target_date = date.today()

    start_time_str = payload.start_time or datetime.now().strftime("%I:%M %p").lstrip("0")
    end_time_str = payload.end_time or datetime.now().strftime("%I:%M %p").lstrip("0")
    errors_json = json.dumps(payload.common_errors) if payload.common_errors is not None else "[]"
    avg_score = float(payload.avg_form_score if payload.avg_form_score is not None else 100.0)

    async with get_db() as cur:
        await cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        user_row = await cur.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = str(user_row["id"])

        # Check if updating an existing workout item belonging to this user
        if payload.id:
            await cur.execute(
                """
                SELECT whi.id, whi.history_id
                FROM workout_history_items whi
                JOIN workout_history wh ON whi.history_id = wh.id
                WHERE whi.id = %s AND wh.user_id = %s
                """,
                (payload.id, user_id)
            )
            existing = await cur.fetchone()
            if existing:
                await cur.execute(
                    """
                    UPDATE workout_history_items
                    SET exercise_name = %s,
                        duration_seconds = %s,
                        reps = %s,
                        calories_burned = %s
                    WHERE id = %s
                    """,
                    (
                        norm_exercise,
                        int(payload.duration_seconds),
                        int(payload.reps),
                        float(payload.calories_burned),
                        payload.id,
                    )
                )
                await cur.execute(
                    "UPDATE workout_history SET updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (str(existing["history_id"]),)
                )

                # Also update in table `sessions`
                await cur.execute(
                    """
                    UPDATE sessions
                    SET exercise = %s,
                        start_time = %s,
                        end_time = %s,
                        total_reps = %s,
                        avg_form_score = %s,
                        duration_seconds = %s,
                        calories = %s,
                        common_errors = %s
                    WHERE id = %s
                    """,
                    (
                        norm_exercise,
                        start_time_str,
                        end_time_str,
                        int(payload.reps),
                        avg_score,
                        float(payload.duration_seconds),
                        float(payload.calories_burned),
                        errors_json,
                        payload.id,
                    )
                )

                return {
                    "success": True,
                    "message": "Workout item and session updated",
                    "history_id": str(existing["history_id"]),
                    "item_id": payload.id,
                }

        # Check / create workout_history for (user_id, target_date)
        await cur.execute(
            "SELECT id FROM workout_history WHERE user_id = %s AND date = %s",
            (user_id, target_date)
        )
        wh = await cur.fetchone()
        if wh:
            history_id = str(wh["id"])
            await cur.execute(
                "UPDATE workout_history SET updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (history_id,)
            )
        else:
            history_id = str(uuid.uuid4())
            await cur.execute(
                """
                INSERT INTO workout_history (id, user_id, date)
                VALUES (%s, %s, %s)
                """,
                (history_id, user_id, target_date)
            )

        # Insert item into workout_history_items
        item_id = str(uuid.uuid4())
        await cur.execute(
            """
            INSERT INTO workout_history_items 
                (id, history_id, exercise_name, start_time, duration_seconds, reps, calories_burned)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                item_id,
                history_id,
                norm_exercise,
                start_time_str,
                int(payload.duration_seconds),
                int(payload.reps),
                float(payload.calories_burned),
            )
        )

        # Insert session into table `sessions`
        await cur.execute(
            """
            INSERT INTO sessions 
                (id, user_id, exercise, start_time, end_time, total_reps, avg_form_score, duration_seconds, calories, common_errors)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                item_id,
                username,
                norm_exercise,
                start_time_str,
                end_time_str,
                int(payload.reps),
                avg_score,
                float(payload.duration_seconds),
                float(payload.calories_burned),
                errors_json,
            )
        )

    return {
        "success": True,
        "message": "Workout saved to history and sessions table",
        "history_id": history_id,
        "item_id": item_id,
    }
