from typing import Dict, List, Tuple, Any

class FormChecker:
    """
    Evaluates biomechanical posture and returns form scores (0-100),
    active error tags, and real-time coaching feedback.
    """

    @staticmethod
    def check_squat(angles: Dict[str, float], landmarks: List[Dict[str, float]], phase: str) -> Tuple[int, List[str], str]:
        errors = []
        score = 100
        feedback = "Great form! Keep driving through your heels."

        knee = angles.get("knee", 180.0)
        torso = angles.get("torso", 0.0)

        # 1. Back Rounding / Excessive Forward Lean
        if torso > 42.0:
            errors.append("back_rounding")
            score -= 25
            feedback = "Keep your chest up and core engaged."

        # 2. Shallow Depth during down phase
        if phase == "down" and knee > 118.0:
            errors.append("shallow_depth")
            score -= 20
            feedback = "Sink a little deeper to hit parallel."

        # 3. Knee Valgus / Knees Caving
        # Compare left/right knee distance to left/right ankle distance
        if len(landmarks) >= 33:
            l_knee_x, r_knee_x = landmarks[25]["x"], landmarks[26]["x"]
            l_ank_x, r_ank_x = landmarks[27]["x"], landmarks[28]["x"]
            knee_dist = abs(l_knee_x - r_knee_x)
            ankle_dist = abs(l_ank_x - r_ank_x)
            if knee_dist < (ankle_dist * 0.78) and ankle_dist > 0.1:
                errors.append("knees_caving")
                score -= 30
                feedback = "Push your knees outward over your toes."

        return max(score, 30), errors, feedback

    @staticmethod
    def check_pushup(angles: Dict[str, float], landmarks: List[Dict[str, float]], phase: str) -> Tuple[int, List[str], str]:
        errors = []
        score = 100
        feedback = "Solid push-up! Keep your body locked."

        elbow = angles.get("elbow", 180.0)
        hip = angles.get("hip", 180.0)
        plank_line = angles.get("plank_line", 180.0)

        # 1. Hips Sagging
        if plank_line < 152.0:
            errors.append("hips_sagging")
            score -= 35
            feedback = "Squeeze your glutes to stop your hips from sagging."
        elif plank_line > 200.0:
            errors.append("hips_piking")
            score -= 25
            feedback = "Lower your hips into a straight plank line."

        # 2. Shallow Depth
        if phase == "down" and elbow > 105.0:
            errors.append("shallow_depth")
            score -= 20
            feedback = "Lower your chest closer to the floor."

        # 3. Head Dropping
        if len(landmarks) >= 13:
            nose_y = landmarks[0]["y"]
            sh_y = (landmarks[11]["y"] + landmarks[12]["y"]) / 2.0
            if (nose_y - sh_y) > 0.15:
                errors.append("head_dropping")
                score -= 15
                feedback = "Keep your neck neutral; don't crane your neck down."

        return max(score, 30), errors, feedback

    @staticmethod
    def check_plank(angles: Dict[str, float], landmarks: List[Dict[str, float]], phase: str) -> Tuple[int, List[str], str]:
        errors = []
        score = 100
        feedback = "Perfect alignment. Hold strong!"

        plank_line = angles.get("plank_line", 180.0)

        if plank_line < 155.0:
            errors.append("hips_sagging")
            score -= 40
            feedback = "Lift your hips up; keep your core tight."
        elif plank_line > 195.0:
            errors.append("hips_piking")
            score -= 30
            feedback = "Lower your hips to form a flat line from shoulders to ankles."

        return max(score, 20), errors, feedback

    @staticmethod
    def check_bicep_curl(angles: Dict[str, float], landmarks: List[Dict[str, float]], phase: str) -> Tuple[int, List[str], str]:
        errors = []
        score = 100
        feedback = "Controlled curl. Squeeze at the peak!"

        torso = angles.get("torso", 0.0)
        shoulder = angles.get("shoulder", 0.0)

        # 1. Back Swinging
        if torso > 16.0:
            errors.append("back_swinging")
            score -= 30
            feedback = "Don't swing your back. Keep your torso steady."

        # 2. Elbow Drift
        if shoulder > 35.0:
            errors.append("elbow_drift")
            score -= 25
            feedback = "Pin your elbows to your sides."

        return max(score, 30), errors, feedback

    @staticmethod
    def check_jumping_jack(angles: Dict[str, float], landmarks: List[Dict[str, float]], phase: str) -> Tuple[int, List[str], str]:
        errors = []
        score = 100
        feedback = "High energy! Maintain your rhythm."

        l_sh = angles.get("left_shoulder", 0.0)
        r_sh = angles.get("right_shoulder", 0.0)

        if phase == "up":
            if max(l_sh, r_sh) < 130.0:
                errors.append("incomplete_arm_extension")
                score -= 25
                feedback = "Raise your hands fully above your head."

            if abs(l_sh - r_sh) > 28.0:
                errors.append("asymmetric_movement")
                score -= 20
                feedback = "Keep both arms raising evenly."

        return max(score, 40), errors, feedback

    @classmethod
    def evaluate(cls, exercise: str, angles: Dict[str, float], landmarks: List[Dict[str, float]], phase: str) -> Dict[str, Any]:
        ex = exercise.lower()
        if "squat" in ex:
            score, errors, feedback = cls.check_squat(angles, landmarks, phase)
        elif "push" in ex:
            score, errors, feedback = cls.check_pushup(angles, landmarks, phase)
        elif "plank" in ex:
            score, errors, feedback = cls.check_plank(angles, landmarks, phase)
        elif "curl" in ex:
            score, errors, feedback = cls.check_bicep_curl(angles, landmarks, phase)
        elif "jack" in ex:
            score, errors, feedback = cls.check_jumping_jack(angles, landmarks, phase)
        else:
            score, errors, feedback = 95, [], "Tracking active."

        return {
            "form_score": score,
            "form_errors": errors,
            "feedback": feedback,
        }

