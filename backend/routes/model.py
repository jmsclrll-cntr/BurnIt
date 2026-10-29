import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from models import TrainModelRequest, ModelStatusResponse
from train_model import train_exercise_classifier
from exercise_classifier import exercise_classifier
from auth import require_admin
from config import settings

router = APIRouter(prefix="/api/model", tags=["model"])

@router.post("/train")
async def train_model(body: TrainModelRequest = TrainModelRequest(), _=Depends(require_admin)):
    result = train_exercise_classifier(n_estimators=body.n_estimators, test_size=body.test_size)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Training failed"))

    # Immediately reload model into active classifier
    exercise_classifier.reload_model()
    return result

@router.post("/reload")
async def reload_model(_=Depends(require_admin)):
    loaded = exercise_classifier.reload_model()
    return {"status": "reloaded" if loaded else "no_model_file_found", "loaded": loaded}

@router.get("/status", response_model=ModelStatusResponse)
async def get_model_status():
    model_file = os.path.join(settings.MODEL_DIR, "exercise_model.joblib")
    loaded = exercise_classifier.model is not None
    last_trained = None

    if os.path.exists(model_file):
        mtime = os.path.getmtime(model_file)
        last_trained = datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()

    return ModelStatusResponse(
        loaded=loaded,
        model_name="RandomForestClassifier" if loaded else None,
        last_trained=last_trained,
        accuracy=None,
        features=[
            "33 normalized pose landmarks (x, y, z)",
            "6 smoothed joint angles (knee, hip, elbow, shoulder, torso, plank)",
        ],
    )

