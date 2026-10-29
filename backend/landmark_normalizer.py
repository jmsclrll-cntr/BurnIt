import math
from typing import List, Dict, Any

def normalize_landmarks(landmarks: List[Dict[str, float]]) -> List[Dict[str, float]]:
    """
    Normalizes 33 MediaPipe pose landmarks relative to the hip center,
    scaled by the torso length (hip center to shoulder center).
    
    This ensures scale-invariance and translation-invariance for ML features.
    """
    if not landmarks or len(landmarks) < 33:
        return []

    # Midpoints of shoulders (11, 12) and hips (23, 24)
    sh_center_x = (landmarks[11]["x"] + landmarks[12]["x"]) / 2.0
    sh_center_y = (landmarks[11]["y"] + landmarks[12]["y"]) / 2.0
    sh_center_z = (landmarks[11]["z"] + landmarks[12]["z"]) / 2.0

    hip_center_x = (landmarks[23]["x"] + landmarks[24]["x"]) / 2.0
    hip_center_y = (landmarks[23]["y"] + landmarks[24]["y"]) / 2.0
    hip_center_z = (landmarks[23]["z"] + landmarks[24]["z"]) / 2.0

    # Euclidean distance for torso scale
    dx = sh_center_x - hip_center_x
    dy = sh_center_y - hip_center_y
    dz = sh_center_z - hip_center_z
    torso_len = math.sqrt(dx * dx + dy * dy + dz * dz)

    # Avoid zero division
    if torso_len < 1e-4:
        torso_len = 1.0

    normalized = []
    for lm in landmarks:
        norm_x = (lm["x"] - hip_center_x) / torso_len
        norm_y = (lm["y"] - hip_center_y) / torso_len
        norm_z = (lm["z"] - hip_center_z) / torso_len
        normalized.append({
            "x": round(norm_x, 4),
            "y": round(norm_y, 4),
            "z": round(norm_z, 4),
            "visibility": lm.get("visibility", 1.0),
        })

    return normalized

def flatten_landmarks_for_ml(normalized: List[Dict[str, float]], angles: Dict[str, float]) -> List[float]:
    """
    Produces a 1D feature vector for ML classifiers containing:
    - 33 * 3 = 99 normalized coordinate values
    - 6 core joint angles (knee, hip, elbow, shoulder, torso, plank_line)
    Total dimension: 105 features
    """
    features: List[float] = []
    for lm in normalized:
        features.extend([lm["x"], lm["y"], lm["z"]])

    features.append(angles.get("knee", 180.0))
    features.append(angles.get("hip", 180.0))
    features.append(angles.get("elbow", 180.0))
    features.append(angles.get("shoulder", 0.0))
    features.append(angles.get("torso", 0.0))
    features.append(angles.get("plank_line", 180.0))

    return features

