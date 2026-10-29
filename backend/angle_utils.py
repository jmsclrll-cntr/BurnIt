import math
from collections import deque
from typing import Dict, List, Optional, Tuple

class AngleSmoother:
    """
    Maintains a 5-frame moving average for computed joint angles
    to eliminate frame-to-frame detection jitter.
    """
    def __init__(self, window_size: int = 5):
        self.window_size = window_size
        self.buffers: Dict[str, deque] = {}

    def smooth(self, angle_name: str, value: float) -> float:
        if angle_name not in self.buffers:
            self.buffers[angle_name] = deque(maxlen=self.window_size)
        self.buffers[angle_name].append(value)
        return float(sum(self.buffers[angle_name]) / len(self.buffers[angle_name]))

    def reset(self):
        self.buffers.clear()

def calculate_angle_3d(a: Dict[str, float], b: Dict[str, float], c: Dict[str, float]) -> float:
    """
    Calculates the 2D planar joint angle in degrees at vertex B given points A-B-C.
    Returns angle in range [0, 180].
    """
    # Vector BA and Vector BC
    ba_x = a["x"] - b["x"]
    ba_y = a["y"] - b["y"]
    bc_x = c["x"] - b["x"]
    bc_y = c["y"] - b["y"]

    # Calculate angle using atan2 for numerical stability
    angle_rad = math.atan2(ba_y * bc_x - ba_x * bc_y, ba_x * bc_x + ba_y * bc_y)
    angle_deg = abs(math.degrees(angle_rad))
    if angle_deg > 180.0:
        angle_deg = 360.0 - angle_deg
    return round(angle_deg, 2)

def calculate_vertical_angle(top: Dict[str, float], bottom: Dict[str, float]) -> float:
    """
    Calculates angle of line (bottom -> top) relative to true vertical (0 deg = straight up).
    Useful for torso angle during squats and curls.
    """
    dx = top["x"] - bottom["x"]
    dy = bottom["y"] - top["y"]  # Image y is inverted (0 at top)
    rad = math.atan2(abs(dx), dy)
    return round(math.degrees(rad), 2)

# MediaPipe Pose Landmark Indices:
# 11: left_shoulder, 12: right_shoulder
# 13: left_elbow,    14: right_elbow
# 15: left_wrist,    16: right_wrist
# 23: left_hip,      24: right_hip
# 25: left_knee,     26: right_knee
# 27: left_ankle,    28: right_ankle

def extract_joint_angles(landmarks: List[Dict[str, float]], smoother: Optional[AngleSmoother] = None) -> Dict[str, float]:
    """
    Extracts all standard biometric joint angles from 33 MediaPipe landmarks.
    Selects the side (left/right) with highest visibility or averages both.
    """
    if not landmarks or len(landmarks) < 33:
        return {}

    # Extract key landmarks
    l_sh = landmarks[11]
    r_sh = landmarks[12]
    l_el = landmarks[13]
    r_el = landmarks[14]
    l_wr = landmarks[15]
    r_wr = landmarks[16]
    l_hip = landmarks[23]
    r_hip = landmarks[24]
    l_knee = landmarks[25]
    r_knee = landmarks[26]
    l_ank = landmarks[27]
    r_ank = landmarks[28]

    # Calculate bilateral angles
    l_knee_ang = calculate_angle_3d(l_hip, l_knee, l_ank)
    r_knee_ang = calculate_angle_3d(r_hip, r_knee, r_ank)

    l_hip_ang = calculate_angle_3d(l_sh, l_hip, l_knee)
    r_hip_ang = calculate_angle_3d(r_sh, r_hip, r_knee)

    l_el_ang = calculate_angle_3d(l_sh, l_el, l_wr)
    r_el_ang = calculate_angle_3d(r_sh, r_el, r_wr)

    l_sh_ang = calculate_angle_3d(l_hip, l_sh, l_el)
    r_sh_ang = calculate_angle_3d(r_hip, r_sh, r_el)

    # Plank alignment: shoulder - hip - ankle
    l_plank_line = calculate_angle_3d(l_sh, l_hip, l_ank)
    r_plank_line = calculate_angle_3d(r_sh, r_hip, r_ank)

    # Midpoints for torso vertical angle
    mid_shoulder = {
        "x": (l_sh["x"] + r_sh["x"]) / 2.0,
        "y": (l_sh["y"] + r_sh["y"]) / 2.0,
    }
    mid_hip = {
        "x": (l_hip["x"] + r_hip["x"]) / 2.0,
        "y": (l_hip["y"] + r_hip["y"]) / 2.0,
    }
    torso_ang = calculate_vertical_angle(mid_shoulder, mid_hip)

    # Determine dominant/active side based on landmark confidence
    left_vis = (l_knee["visibility"] + l_hip["visibility"] + l_el["visibility"]) / 3.0
    right_vis = (r_knee["visibility"] + r_hip["visibility"] + r_el["visibility"]) / 3.0

    if abs(left_vis - right_vis) > 0.2:
        dominant_knee = l_knee_ang if left_vis > right_vis else r_knee_ang
        dominant_hip = l_hip_ang if left_vis > right_vis else r_hip_ang
        dominant_elbow = l_el_ang if left_vis > right_vis else r_el_ang
        dominant_shoulder = l_sh_ang if left_vis > right_vis else r_sh_ang
        dominant_plank = l_plank_line if left_vis > right_vis else r_plank_line
    else:
        dominant_knee = (l_knee_ang + r_knee_ang) / 2.0
        dominant_hip = (l_hip_ang + r_hip_ang) / 2.0
        dominant_elbow = (l_el_ang + r_el_ang) / 2.0
        dominant_shoulder = (l_sh_ang + r_sh_ang) / 2.0
        dominant_plank = (l_plank_line + r_plank_line) / 2.0

    raw_angles = {
        "knee": dominant_knee,
        "left_knee": l_knee_ang,
        "right_knee": r_knee_ang,
        "hip": dominant_hip,
        "left_hip": l_hip_ang,
        "right_hip": r_hip_ang,
        "elbow": dominant_elbow,
        "left_elbow": l_el_ang,
        "right_elbow": r_el_ang,
        "shoulder": dominant_shoulder,
        "left_shoulder": l_sh_ang,
        "right_shoulder": r_sh_ang,
        "torso": torso_ang,
        "plank_line": dominant_plank,
    }

    if smoother:
        smoothed_angles = {}
        for k, v in raw_angles.items():
            smoothed_angles[k] = round(smoother.smooth(k, v), 1)
        return smoothed_angles

    return {k: round(v, 1) for k, v in raw_angles.items()}

