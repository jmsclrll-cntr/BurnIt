import time
from typing import Dict, List, Tuple, Any

class BaseExerciseCounter:
    def __init__(self):
        self.rep_count = 0
        self.phase = "up"
        self.min_angle_reached = 180.0
        self.max_angle_reached = 0.0

    def update(self, angles: Dict[str, float], landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        raise NotImplementedError

    def reset(self):
        self.rep_count = 0
        self.phase = "up"
        self.min_angle_reached = 180.0
        self.max_angle_reached = 0.0

class SquatCounter(BaseExerciseCounter):
    """
    Squat State Machine:
    - Down threshold: Knee angle < 110 deg
    - Up threshold: Knee angle > 160 deg
    - Hysteresis: Prevents micro-oscillation bounce counts
    """
    def __init__(self):
        super().__init__()
        self.down_threshold = 110.0
        self.up_threshold = 160.0
        self.hysteresis = 10.0

    def update(self, angles: Dict[str, float], landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        knee = angles.get("knee", 180.0)
        is_rep_complete = False

        if knee < self.min_angle_reached:
            self.min_angle_reached = knee
        if knee > self.max_angle_reached:
            self.max_angle_reached = knee

        if self.phase == "up":
            # Transition to down phase once past threshold + hysteresis
            if knee < self.down_threshold:
                self.phase = "down"
                self.min_angle_reached = knee
        elif self.phase == "down":
            # Transition to up phase and credit rep once stood up straight
            if knee > self.up_threshold:
                self.phase = "up"
                # Check that full range of motion occurred (< 115 deg achieved at bottom)
                if self.min_angle_reached < (self.down_threshold + 5.0):
                    self.rep_count += 1
                    is_rep_complete = True
                self.min_angle_reached = 180.0

        return {
            "rep_count": self.rep_count,
            "phase": self.phase,
            "is_rep_complete": is_rep_complete,
            "depth_angle": self.min_angle_reached,
        }

class PushupCounter(BaseExerciseCounter):
    """
    Push-up State Machine:
    - Down threshold: Elbow angle < 90 deg
    - Up threshold: Elbow angle > 160 deg
    """
    def __init__(self):
        super().__init__()
        self.down_threshold = 95.0
        self.up_threshold = 158.0

    def update(self, angles: Dict[str, float], landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        elbow = angles.get("elbow", 180.0)
        is_rep_complete = False

        if elbow < self.min_angle_reached:
            self.min_angle_reached = elbow

        if self.phase == "up":
            if elbow < self.down_threshold:
                self.phase = "down"
                self.min_angle_reached = elbow
        elif self.phase == "down":
            if elbow > self.up_threshold:
                self.phase = "up"
                if self.min_angle_reached < 100.0:
                    self.rep_count += 1
                    is_rep_complete = True
                self.min_angle_reached = 180.0

        return {
            "rep_count": self.rep_count,
            "phase": self.phase,
            "is_rep_complete": is_rep_complete,
        }

class BicepCurlCounter(BaseExerciseCounter):
    """
    Bicep Curl State Machine:
    - Curled threshold: Elbow angle < 50 deg
    - Extended threshold: Elbow angle > 150 deg
    """
    def __init__(self):
        super().__init__()
        self.curled_threshold = 50.0
        self.extended_threshold = 150.0

    def update(self, angles: Dict[str, float], landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        elbow = angles.get("elbow", 180.0)
        is_rep_complete = False

        if elbow < self.min_angle_reached:
            self.min_angle_reached = elbow

        if self.phase == "down" or self.phase == "extended":
            if elbow < self.curled_threshold:
                self.phase = "curled"
                self.min_angle_reached = elbow
        elif self.phase == "curled" or self.phase == "up":
            if elbow > self.extended_threshold:
                self.phase = "down"
                if self.min_angle_reached < 55.0:
                    self.rep_count += 1
                    is_rep_complete = True
                self.min_angle_reached = 180.0

        return {
            "rep_count": self.rep_count,
            "phase": "up" if self.phase == "curled" else "down",
            "is_rep_complete": is_rep_complete,
        }

class JumpingJackCounter(BaseExerciseCounter):
    """
    Jumping Jack State Machine:
    - Arms up threshold: Shoulder angle > 140 deg
    - Arms down threshold: Shoulder angle < 35 deg
    """
    def __init__(self):
        super().__init__()
        self.up_threshold = 140.0
        self.down_threshold = 35.0

    def update(self, angles: Dict[str, float], landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        shoulder = angles.get("shoulder", 0.0)
        is_rep_complete = False

        if self.phase == "down":
            if shoulder > self.up_threshold:
                self.phase = "up"
        elif self.phase == "up":
            if shoulder < self.down_threshold:
                self.phase = "down"
                self.rep_count += 1
                is_rep_complete = True

        return {
            "rep_count": self.rep_count,
            "phase": self.phase,
            "is_rep_complete": is_rep_complete,
        }

class PlankCounter(BaseExerciseCounter):
    """
    Plank Hold Timer:
    - Measures elapsed seconds while body form stays aligned (160 - 180 deg).
    - Pauses hold accumulation immediately when hips sag or pike.
    """
    def __init__(self):
        super().__init__()
        self.phase = "hold"
        self.hold_seconds = 0.0
        self.last_timestamp = None
        self.min_line_angle = 158.0
        self.max_line_angle = 195.0

    def update(self, angles: Dict[str, float], landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        plank_line = angles.get("plank_line", 180.0)
        now = time.time()
        is_valid_alignment = self.min_line_angle <= plank_line <= self.max_line_angle

        if self.last_timestamp is not None:
            dt = now - self.last_timestamp
            if dt < 1.0 and is_valid_alignment:
                self.hold_seconds += dt

        self.last_timestamp = now
        # Rep count for plank represents cumulative hold seconds
        self.rep_count = int(self.hold_seconds)
        self.phase = "hold" if is_valid_alignment else "form_break"

        return {
            "rep_count": self.rep_count,
            "phase": self.phase,
            "is_rep_complete": False,
            "hold_seconds": round(self.hold_seconds, 1),
            "is_valid_alignment": is_valid_alignment,
        }

def create_counter(exercise: str) -> BaseExerciseCounter:
    ex = exercise.lower().replace("-", "_").replace(" ", "_")
    if "squat" in ex:
        return SquatCounter()
    elif "push" in ex:
        return PushupCounter()
    elif "curl" in ex:
        return BicepCurlCounter()
    elif "jack" in ex:
        return JumpingJackCounter()
    elif "plank" in ex:
        return PlankCounter()
    # Default to squat
    return SquatCounter()

