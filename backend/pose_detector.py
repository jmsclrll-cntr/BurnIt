import cv2
import numpy as np
import logging
import os
import urllib.request
from typing import List, Dict, Optional, Any
from config import settings

logger = logging.getLogger("burnit.pose")

MODEL_URLS = {
    "lite": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
    "full": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"
}

class PoseDetector:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PoseDetector, cls).__new__(cls)
            cls._instance._init_detector()
        return cls._instance

    def _init_detector(self):
        self.detector = None
        self.mode = None
        
        # Try MediaPipe Tasks API first (MediaPipe >= 0.10 / 1.0+)
        try:
            import mediapipe as mp
            from mediapipe.tasks import python
            from mediapipe.tasks.python import vision

            model_type = "lite" if settings.MEDIAPIPE_MODEL == "lite" else "full"
            model_dir = settings.MODEL_DIR
            os.makedirs(model_dir, exist_ok=True)
            model_path = os.path.join(model_dir, f"pose_landmarker_{model_type}.task")

            if not os.path.exists(model_path):
                url = MODEL_URLS.get(model_type, MODEL_URLS["lite"])
                logger.info(f"Downloading MediaPipe pose landmarker model to {model_path}...")
                urllib.request.urlretrieve(url, model_path)

            base_options = python.BaseOptions(model_asset_path=model_path)
            options = vision.PoseLandmarkerOptions(
                base_options=base_options,
                output_segmentation_masks=False,
                min_pose_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self.detector = vision.PoseLandmarker.create_from_options(options)
            self.mp = mp
            self.mode = "tasks"
            logger.info(f"MediaPipe Tasks PoseLandmarker initialized with model {model_path}")
            return
        except Exception as e:
            logger.info("MediaPipe Tasks API not used (%s). Trying mp.solutions.pose...", e)

        # Fallback to legacy MediaPipe Solutions API
        try:
            import mediapipe as mp
            if hasattr(mp, "solutions") and hasattr(mp.solutions, "pose"):
                complexity = 0 if settings.MEDIAPIPE_MODEL == "lite" else 1
                self.detector = mp.solutions.pose.Pose(
                    static_image_mode=False,
                    model_complexity=complexity,
                    smooth_landmarks=True,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5,
                )
                self.mode = "solutions"
                logger.info("MediaPipe Solutions Pose initialized successfully")
                return
        except Exception as e:
            logger.warning("MediaPipe Solutions fallback failed: %s", e)

        logger.warning("No MediaPipe backend available. Pose detection disabled.")

    def detect(self, frame: np.ndarray) -> Optional[List[Dict[str, float]]]:
        """
        Runs pose landmarking on an incoming BGR frame.
        Resizes frame to max 640x480 for sub-150ms latency.
        Returns a list of 33 landmark dictionaries [{x, y, z, visibility}] or None.
        """
        if frame is None or frame.size == 0 or self.detector is None:
            return None

        # Resize to max 640x480 preserving aspect ratio
        h, w = frame.shape[:2]
        max_dim = 640
        if max(h, w) > max_dim:
            scale = max_dim / float(max(h, w))
            new_w, new_h = int(w * scale), int(h * scale)
            frame_resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
        else:
            frame_resized = frame

        try:
            rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)

            if self.mode == "tasks":
                mp_image = self.mp.Image(image_format=self.mp.ImageFormat.SRGB, data=rgb)
                results = self.detector.detect(mp_image)
                if not results.pose_landmarks or len(results.pose_landmarks) == 0:
                    return None
                
                # First detected person
                first_landmarks = results.pose_landmarks[0]
                landmarks = []
                for lm in first_landmarks:
                    landmarks.append({
                        "x": float(lm.x),
                        "y": float(lm.y),
                        "z": float(lm.z),
                        "visibility": float(getattr(lm, "visibility", 1.0)),
                    })
                return landmarks

            elif self.mode == "solutions":
                results = self.detector.process(rgb)
                if not results.pose_landmarks:
                    return None

                landmarks = []
                for lm in results.pose_landmarks.landmark:
                    landmarks.append({
                        "x": float(lm.x),
                        "y": float(lm.y),
                        "z": float(lm.z),
                        "visibility": float(getattr(lm, "visibility", 1.0)),
                    })
                return landmarks

        except Exception as e:
            logger.error("Pose detection error: %s", e)
            return None

        return None

pose_detector = PoseDetector()
