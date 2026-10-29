import os
import csv
import time
import logging
from typing import Dict, List, Optional, Any
from config import settings
import aiosqlite

logger = logging.getLogger("burnit.recorder")

CSV_HEADER = [
    "timestamp", "exercise", "phase", "form_label", "error_type", "subject_id", "camera_view"
]
# Add raw landmarks columns (lm_0_x ... lm_32_vis)
for i in range(33):
    CSV_HEADER.extend([f"raw_{i}_x", f"raw_{i}_y", f"raw_{i}_z", f"raw_{i}_vis"])

# Add normalized landmarks columns (norm_0_x ... norm_32_z)
for i in range(33):
    CSV_HEADER.extend([f"norm_{i}_x", f"norm_{i}_y", f"norm_{i}_z"])

# Add biometric joint angles
CSV_HEADER.extend(["angle_knee", "angle_hip", "angle_elbow", "angle_shoulder", "angle_torso", "angle_plank_line"])

class DatasetRecorder:
    def __init__(self):
        self.active_recordings: Dict[str, Dict[str, Any]] = {}

    def start_recording(self, recording_id: str, config: Dict[str, Any]):
        self.active_recordings[recording_id] = {
            "exercise": config.get("exercise", "squat"),
            "phase": config.get("phase", "down"),
            "form_label": config.get("form_label", "correct"),
            "error_type": config.get("error_type", "none"),
            "subject_id": config.get("subject_id", "sub_01"),
            "camera_view": config.get("camera_view", "front"),
            "frame_count": 0,
            "start_time": time.time(),
        }
        logger.info("Started recording %s for exercise %s", recording_id, config.get("exercise"))

    def record_frame(
        self,
        recording_id: str,
        landmarks: List[Dict[str, float]],
        norm_landmarks: List[Dict[str, float]],
        angles: Dict[str, float],
    ) -> bool:
        rec = self.active_recordings.get(recording_id)
        if not rec or not landmarks or len(landmarks) < 33:
            return False

        # Key landmark visibility check: shoulders, hips, knees
        key_indices = [11, 12, 23, 24, 25, 26]
        avg_vis = sum(landmarks[i].get("visibility", 1.0) for i in key_indices) / len(key_indices)
        if avg_vis < 0.5:
            # Skip low visibility frame
            return False

        exercise = rec["exercise"].lower().replace(" ", "_")
        csv_filename = os.path.join(settings.DATASET_DIR, f"{exercise}.csv")
        file_exists = os.path.exists(csv_filename)

        row = [
            time.time(),
            rec["exercise"],
            rec["phase"],
            rec["form_label"],
            rec["error_type"],
            rec["subject_id"],
            rec["camera_view"],
        ]

        # Raw landmarks
        for lm in landmarks:
            row.extend([lm["x"], lm["y"], lm["z"], lm.get("visibility", 1.0)])

        # Normalized landmarks
        for nlm in norm_landmarks:
            row.extend([nlm["x"], nlm["y"], nlm["z"]])

        # Angles
        row.extend([
            angles.get("knee", 180.0),
            angles.get("hip", 180.0),
            angles.get("elbow", 180.0),
            angles.get("shoulder", 0.0),
            angles.get("torso", 0.0),
            angles.get("plank_line", 180.0),
        ])

        try:
            with open(csv_filename, "a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow(CSV_HEADER)
                writer.writerow(row)
            rec["frame_count"] += 1
            return True
        except Exception as e:
            logger.error("Failed to write dataset frame: %s", e)
            return False

    async def stop_recording(self, recording_id: str) -> Optional[Dict[str, Any]]:
        rec = self.active_recordings.pop(recording_id, None)
        if not rec:
            return None

        exercise = rec["exercise"].lower().replace(" ", "_")
        csv_path = os.path.join(settings.DATASET_DIR, f"{exercise}.csv")

        async with aiosqlite.connect(settings.DATABASE_PATH) as db:
            await db.execute("""
                INSERT INTO dataset_metadata (id, exercise, phase, form_label, error_type, subject_id, camera_view, frame_count, csv_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                recording_id,
                rec["exercise"],
                rec["phase"],
                rec["form_label"],
                rec["error_type"],
                rec["subject_id"],
                rec["camera_view"],
                rec["frame_count"],
                csv_path,
            ))
            await db.commit()

        return rec

    def get_stats(self) -> Dict[str, Any]:
        total_frames = 0
        exercises: Dict[str, int] = {}
        phases: Dict[str, int] = {}
        form_labels: Dict[str, int] = {}
        csv_files = []

        if os.path.exists(settings.DATASET_DIR):
            for filename in os.listdir(settings.DATASET_DIR):
                if filename.endswith(".csv"):
                    csv_files.append(filename)
                    path = os.path.join(settings.DATASET_DIR, filename)
                    try:
                        with open(path, "r", encoding="utf-8") as f:
                            reader = csv.reader(f)
                            header = next(reader, None)
                            count = 0
                            for r in reader:
                                count += 1
                                if len(r) >= 4:
                                    ex = r[1]
                                    ph = r[2]
                                    fm = r[3]
                                    exercises[ex] = exercises.get(ex, 0) + 1
                                    phases[ph] = phases.get(ph, 0) + 1
                                    form_labels[fm] = form_labels.get(fm, 0) + 1
                            total_frames += count
                    except Exception as e:
                        logger.error("Failed reading %s: %s", filename, e)

        return {
            "total_frames": total_frames,
            "exercises": exercises,
            "phases": phases,
            "form_labels": form_labels,
            "csv_files": csv_files,
        }

dataset_recorder = DatasetRecorder()

