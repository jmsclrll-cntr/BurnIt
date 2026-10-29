import uuid
import time
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import aiosqlite
from config import settings
from angle_utils import AngleSmoother
from exercise_counters import create_counter

class ActiveSessionState:
    def __init__(self, session_id: str, exercise: str, user_id: str = "guest"):
        self.session_id = session_id
        self.user_id = user_id
        self.exercise = exercise
        self.start_time = time.time()
        self.counter = create_counter(exercise)
        self.smoother = AngleSmoother(window_size=5)
        self.form_scores: List[int] = []
        self.error_counts: Dict[str, int] = {}
        self.feature_history: List[List[float]] = []
        self.last_frame_time = time.time()
        self.is_paused = False

    def change_exercise(self, new_exercise: str):
        self.exercise = new_exercise
        self.counter = create_counter(new_exercise)
        self.smoother.reset()

class SessionManager:
    def __init__(self):
        self.active_sessions: Dict[str, ActiveSessionState] = {}

    def get_or_create_active(self, session_id: str, exercise: str = "squat", user_id: str = "guest") -> ActiveSessionState:
        if session_id not in self.active_sessions:
            self.active_sessions[session_id] = ActiveSessionState(session_id, exercise, user_id)
        return self.active_sessions[session_id]

    async def create_session(self, user_id: str = "guest", exercise: str = "squat") -> str:
        session_id = str(uuid.uuid4())
        self.active_sessions[session_id] = ActiveSessionState(session_id, exercise, user_id)

        now = datetime.now(timezone.utc).isoformat()
        async with aiosqlite.connect(settings.DATABASE_PATH) as db:
            await db.execute("""
                INSERT INTO sessions (id, user_id, exercise, start_time, total_reps, avg_form_score, duration_seconds, calories)
                VALUES (?, ?, ?, ?, 0, 0.0, 0.0, 0.0)
            """, (session_id, user_id, exercise, now))
            await db.commit()

        return session_id

    def calculate_calories(self, exercise: str, total_reps: int, duration_seconds: float) -> float:
        ex = exercise.lower()
        if "plank" in ex:
            # 0.08 kcal per second
            return round(duration_seconds * 0.08, 1)
        elif "push" in ex:
            return round(total_reps * 0.29, 1)
        elif "squat" in ex:
            return round(total_reps * 0.32, 1)
        elif "jack" in ex:
            return round(total_reps * 0.22, 1)
        elif "curl" in ex:
            return round(total_reps * 0.16, 1)
        return round(total_reps * 0.25, 1)

    async def finish_session(self, session_id: str, finish_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        active = self.active_sessions.pop(session_id, None)
        now = datetime.now(timezone.utc).isoformat()

        if active:
            duration = round(time.time() - active.start_time, 1)
            reps = active.counter.rep_count
            avg_score = round(sum(active.form_scores) / max(len(active.form_scores), 1), 1)
            calories = self.calculate_calories(active.exercise, reps, duration)
            common_errors = sorted(active.error_counts.keys(), key=lambda k: active.error_counts[k], reverse=True)[:4]
            exercise = active.exercise
        else:
            duration = float(finish_data.get("duration_seconds", 0.0)) if finish_data else 0.0
            reps = int(finish_data.get("total_reps", 0)) if finish_data else 0
            avg_score = float(finish_data.get("avg_form_score", 0.0)) if finish_data else 0.0
            calories = float(finish_data.get("calories", 0.0)) if finish_data else 0.0
            common_errors = finish_data.get("common_errors", []) if finish_data else []
            exercise = finish_data.get("exercise", "workout") if finish_data else "workout"

        # Override with explicit client data if provided
        if finish_data:
            if "total_reps" in finish_data:
                reps = int(finish_data["total_reps"])
            if "duration_seconds" in finish_data:
                duration = float(finish_data["duration_seconds"])
            if "avg_form_score" in finish_data and finish_data["avg_form_score"] > 0:
                avg_score = float(finish_data["avg_form_score"])
            if "calories" in finish_data and finish_data["calories"] > 0:
                calories = float(finish_data["calories"])

        async with aiosqlite.connect(settings.DATABASE_PATH) as db:
            await db.execute("""
                UPDATE sessions
                SET end_time = ?, total_reps = ?, avg_form_score = ?, duration_seconds = ?, calories = ?, common_errors = ?
                WHERE id = ?
            """, (now, reps, avg_score, duration, calories, json.dumps(common_errors), session_id))
            await db.commit()

        return {
            "id": session_id,
            "exercise": exercise,
            "total_reps": reps,
            "duration_seconds": duration,
            "avg_form_score": avg_score,
            "calories": calories,
            "common_errors": common_errors,
        }

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        async with aiosqlite.connect(settings.DATABASE_PATH) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
            row = await cursor.fetchone()
            if not row:
                return None
            return {
                "id": row["id"],
                "user_id": row["user_id"],
                "exercise": row["exercise"],
                "start_time": row["start_time"],
                "end_time": row["end_time"],
                "total_reps": row["total_reps"],
                "avg_form_score": row["avg_form_score"],
                "duration_seconds": row["duration_seconds"],
                "calories": row["calories"],
                "common_errors": json.loads(row["common_errors"] or "[]"),
            }

    async def get_user_history(self, user_id: str) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(settings.DATABASE_PATH) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
                (user_id,)
            )
            rows = await cursor.fetchall()
            return [
                {
                    "id": r["id"],
                    "exercise": r["exercise"],
                    "total_reps": r["total_reps"],
                    "avg_form_score": r["avg_form_score"],
                    "duration_seconds": r["duration_seconds"],
                    "calories": r["calories"],
                    "created_at": r["created_at"],
                }
                for r in rows
            ]

session_manager = SessionManager()

