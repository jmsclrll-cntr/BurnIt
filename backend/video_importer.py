import os
import cv2
import uuid
import logging
from typing import Dict, Any
from pose_detector import pose_detector
from angle_utils import extract_joint_angles
from landmark_normalizer import normalize_landmarks
from dataset_recorder import dataset_recorder

logger = logging.getLogger("burnit.importer")

async def import_video_file(
    video_path: str,
    exercise: str,
    phase: str = "dynamic",
    form_label: str = "correct",
    error_type: str = "none",
    subject_id: str = "imported_video",
    camera_view: str = "front",
    target_fps: int = 15,
) -> Dict[str, Any]:
    """
    Decodes video frame-by-frame, runs backend MediaPipe pose landmarker,
    and appends numeric vectors to the exercise CSV dataset.
    Deletes the input video file when done to protect user privacy.
    """
    if not os.path.exists(video_path):
        return {"success": False, "error": "Video file not found", "frames_processed": 0}

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"success": False, "error": "Could not open video file", "frames_processed": 0}

    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_interval = max(int(video_fps / target_fps), 1)

    recording_id = str(uuid.uuid4())
    dataset_recorder.start_recording(recording_id, {
        "exercise": exercise,
        "phase": phase,
        "form_label": form_label,
        "error_type": error_type,
        "subject_id": subject_id,
        "camera_view": camera_view,
    })

    frame_idx = 0
    saved_frames = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                landmarks = pose_detector.detect(frame)
                if landmarks:
                    norm_lms = normalize_landmarks(landmarks)
                    angles = extract_joint_angles(landmarks)
                    if dataset_recorder.record_frame(recording_id, landmarks, norm_lms, angles):
                        saved_frames += 1

            frame_idx += 1
    finally:
        cap.release()
        await dataset_recorder.stop_recording(recording_id)
        # Security & Privacy: Never keep video files on disk
        if os.path.exists(video_path):
            try:
                os.remove(video_path)
                logger.info("Permanently deleted imported video file %s after processing.", video_path)
            except Exception as e:
                logger.warning("Failed deleting video file %s: %s", video_path, e)

    return {
        "success": True,
        "exercise": exercise,
        "frames_extracted": frame_idx,
        "landmarks_recorded": saved_frames,
    }

