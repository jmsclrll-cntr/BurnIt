from fastapi import APIRouter
from typing import List
from models import ExerciseInfo

router = APIRouter(prefix="/api/exercises", tags=["exercises"])

SUPPORTED_EXERCISES = [
    ExerciseInfo(
        id="squat",
        name="Bodyweight Squat",
        category="Lower Body & Core",
        description="Fundamental compound movement targeting quadriceps, hamstrings, and gluteal endurance.",
        difficulty="Beginner",
        primary_muscles=["Quadriceps", "Glutes", "Hamstrings", "Core"],
        key_form_cues=[
            "Keep chest elevated and eyes forward",
            "Drive knees out in line with your second toe",
            "Descend until thighs are at least parallel to floor",
            "Press firmly through your heels on the ascent",
        ],
        icon="Flame",
    ),
    ExerciseInfo(
        id="pushup",
        name="Standard Push-up",
        category="Upper Body & Trunk",
        description="Horizontal pressing exercise developing chest, anterior deltoids, and tricep power.",
        difficulty="Intermediate",
        primary_muscles=["Chest (Pectorals)", "Triceps", "Shoulders", "Core"],
        key_form_cues=[
            "Keep a solid plank line from crown of head to heels",
            "Angle elbows 45 degrees back; avoid flaring",
            "Lower chest until elbows reach 90 degrees",
            "Engage core to avoid hip sagging or piking",
        ],
        icon="Zap",
    ),
    ExerciseInfo(
        id="plank",
        name="Isometric Core Plank",
        category="Core Stability",
        description="Static hold training deep abdominal bracing and spinal stabilization endurance.",
        difficulty="Beginner",
        primary_muscles=["Rectus Abdominis", "Transverse Abdominis", "Lower Back"],
        key_form_cues=[
            "Shoulders directly stacked over elbows",
            "Squeeze glutes and quads to keep hips level",
            "Keep neck neutral, looking directly down at hands",
            "Breathe rhythmically without holding breath",
        ],
        icon="Timer",
    ),
    ExerciseInfo(
        id="jumping_jack",
        name="Jumping Jack",
        category="Cardio & Conditioning",
        description="Full-body calisthenic drill driving heart rate elevation and coordination.",
        difficulty="All Levels",
        primary_muscles=["Calves", "Deltoids", "Core", "Cardiovascular"],
        key_form_cues=[
            "Land softly on the balls of your feet",
            "Extend arms fully overhead to touch hands",
            "Maintain symmetrical cadence and breathing",
        ],
        icon="Activity",
    ),
    ExerciseInfo(
        id="bicep_curl",
        name="Bicep Curl",
        category="Upper Body Isolation",
        description="Arm flexion movement strengthening biceps brachii and brachialis muscles.",
        difficulty="Beginner",
        primary_muscles=["Biceps Brachii", "Forearms"],
        key_form_cues=[
            "Pin elbows firmly against your ribcage",
            "Avoid swinging torso or utilizing momentum",
            "Full contraction at peak with controlled lowering",
        ],
        icon="Award",
    ),
    ExerciseInfo(
        id="auto",
        name="Smart Auto-Detect",
        category="AI Multi-Exercise Mode",
        description="Autonomous classifier recognizes your exercise and automatically activates the matching counter.",
        difficulty="Smart AI",
        primary_muscles=["Full Body"],
        key_form_cues=[
            "Perform standard reps of any supported movement",
            "Ensure full body is visible in camera frame",
        ],
        icon="Flame",
    ),
]

@router.get("", response_model=List[ExerciseInfo])
async def get_all_exercises():
    return SUPPORTED_EXERCISES

