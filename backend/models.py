from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    is_admin: bool

class SessionCreate(BaseModel):
    user_id: Optional[str] = "guest"
    exercise: str = "squat"

class SessionResponse(BaseModel):
    id: str
    user_id: Optional[str]
    exercise: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    total_reps: int = 0
    avg_form_score: float = 0.0
    duration_seconds: float = 0.0
    calories: float = 0.0
    common_errors: List[str] = []

class SessionFinish(BaseModel):
    total_reps: int
    duration_seconds: float
    avg_form_score: float
    calories: float
    common_errors: List[str] = []

class ExerciseInfo(BaseModel):
    id: str
    name: str
    category: str
    description: str
    difficulty: str
    primary_muscles: List[str]
    key_form_cues: List[str]
    icon: str

class DatasetRecordStart(BaseModel):
    exercise: str
    phase: str = "down"
    form_label: str = "correct"
    error_type: Optional[str] = "none"
    subject_id: str = "sub_01"
    camera_view: str = "front"

class DatasetRecordStop(BaseModel):
    session_id: str

class DatasetStats(BaseModel):
    total_frames: int
    exercises: Dict[str, int]
    phases: Dict[str, int]
    form_labels: Dict[str, int]
    csv_files: List[str]

class VideoImportRequest(BaseModel):
    exercise: str
    phase: str = "dynamic"
    form_label: str = "correct"
    error_type: Optional[str] = "none"
    subject_id: str = "imported_video"
    camera_view: str = "front"
    fps: int = 15

class TrainModelRequest(BaseModel):
    model_type: str = "random_forest"
    n_estimators: int = 100
    test_size: float = 0.2

class ModelStatusResponse(BaseModel):
    loaded: bool
    model_name: Optional[str] = None
    last_trained: Optional[str] = None
    accuracy: Optional[float] = None
    features: List[str] = []
