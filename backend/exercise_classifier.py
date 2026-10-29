import os
import logging
from typing import Optional, List, Dict, Any
import numpy as np
from config import settings

logger = logging.getLogger("burnit.classifier")

class ExerciseClassifier:
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(settings.MODEL_DIR, "exercise_model.joblib")
        self.load_model()

    def load_model(self) -> bool:
        if os.path.exists(self.model_path):
            try:
                import joblib
                self.model = joblib.load(self.model_path)
                logger.info("Loaded ML model from %s", self.model_path)
                return True
            except Exception as e:
                logger.error("Failed to load model from %s: %s", self.model_path, e)
                self.model = None
                return False
        else:
            logger.info("No ML model found at %s. Falling back to heuristic auto-detect.", self.model_path)
            self.model = None
            return False

    def reload_model(self) -> bool:
        return self.load_model()

    def classify(self, feature_history: List[List[float]], angles: Dict[str, float], landmarks: List[Dict[str, float]]) -> str:
        """
        Classifies the current exercise using either the loaded ML model or
        the robust biomechanical heuristic auto-detector.
        """
        if self.model is not None and len(feature_history) >= 1:
            try:
                # Use latest flattened feature vector
                x = np.array(feature_history[-1]).reshape(1, -1)
                prediction = self.model.predict(x)
                if len(prediction) > 0:
                    return str(prediction[0])
            except Exception as e:
                logger.debug("Model prediction failed: %s, using heuristic fallback", e)

        # Heuristic Auto-Detector based on spatial posture
        if not landmarks or len(landmarks) < 33:
            return "squat"

        sh_y = (landmarks[11]["y"] + landmarks[12]["y"]) / 2.0
        hip_y = (landmarks[23]["y"] + landmarks[24]["y"]) / 2.0
        ank_y = (landmarks[27]["y"] + landmarks[28]["y"]) / 2.0

        sh_angle = angles.get("shoulder", 0.0)
        knee_angle = angles.get("knee", 180.0)
        elbow_angle = angles.get("elbow", 180.0)
        plank_line = angles.get("plank_line", 180.0)

        # Check if horizontal posture (pushup / plank)
        is_horizontal = abs(sh_y - ank_y) < 0.35 and abs(hip_y - ank_y) < 0.35

        if is_horizontal:
            # If elbow is flexing dynamically -> push-up; if static locked -> plank
            if elbow_angle < 130.0:
                return "push-up"
            return "plank"

        # Standing posture:
        # If shoulders are abduction/adduction above 100 deg -> jumping jack
        if sh_angle > 90.0:
            return "jumping_jack"

        # If knees are actively bending -> squat
        if knee_angle < 135.0:
            return "squat"

        # If elbows are flexing while torso and shoulders are quiet -> bicep curl
        if elbow_angle < 110.0 and sh_angle < 45.0:
            return "bicep_curl"

        return "squat"

exercise_classifier = ExerciseClassifier()

