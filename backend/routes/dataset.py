import os
import uuid
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from config import settings
from dataset_recorder import dataset_recorder
from video_importer import import_video_file
from models import DatasetRecordStart, DatasetRecordStop, DatasetStats
from auth import require_admin

router = APIRouter(prefix="/api/dataset", tags=["dataset"])

@router.post("/start")
async def start_dataset_recording(body: DatasetRecordStart, _=Depends(require_admin)):
    rec_id = str(uuid.uuid4())
    dataset_recorder.start_recording(rec_id, body.dict())
    return {"status": "recording_started", "recording_id": rec_id, "config": body.dict()}

@router.post("/stop")
async def stop_dataset_recording(body: DatasetRecordStop, _=Depends(require_admin)):
    result = await dataset_recorder.stop_recording(body.session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Active recording session not found")
    return {"status": "recording_stopped", "details": result}

@router.get("/stats", response_model=DatasetStats)
async def get_dataset_statistics():
    return dataset_recorder.get_stats()

@router.post("/import-video")
async def import_video(
    file: UploadFile = File(...),
    exercise: str = Form("squat"),
    phase: str = Form("dynamic"),
    form_label: str = Form("correct"),
    error_type: str = Form("none"),
    subject_id: str = Form("video_upload"),
    camera_view: str = Form("front"),
    fps: int = Form(15),
    _=Depends(require_admin),
):
    temp_dir = os.path.join(settings.DATASET_DIR, "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = await import_video_file(
            video_path=temp_file_path,
            exercise=exercise,
            phase=phase,
            form_label=form_label,
            error_type=error_type,
            subject_id=subject_id,
            camera_view=camera_view,
            target_fps=fps,
        )
        return result
    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Video import failed: {e}")

@router.get("/export/{exercise}")
async def export_exercise_csv(exercise: str, _=Depends(require_admin)):
    ex = exercise.lower().replace(" ", "_")
    csv_path = os.path.join(settings.DATASET_DIR, f"{ex}.csv")
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail=f"No dataset file found for exercise '{exercise}'")

    return FileResponse(
        path=csv_path,
        filename=f"burnit_dataset_{ex}.csv",
        media_type="text/csv",
    )

