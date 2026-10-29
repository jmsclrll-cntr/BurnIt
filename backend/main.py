import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import init_db
from pose_detector import pose_detector
from exercise_classifier import exercise_classifier
from websocket_handler import handle_workout_websocket
from routes.auth import router as auth_router
from routes.sessions import router as sessions_router
from routes.exercises import router as exercises_router
from routes.dataset import router as dataset_router
from routes.model import router as model_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("burnit.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing BurnIt backend services...")
    await init_db()
    # Force single-instance initialization of MediaPipe pose detector
    _ = pose_detector
    # Attempt to load trained ML model if available
    exercise_classifier.load_model()
    logger.info("BurnIt backend ready. Listening for frontend requests.")
    yield
    logger.info("BurnIt backend shutting down.")

app = FastAPI(
    title="BurnIt Workout Tracker API",
    description="Real-time backend pose estimation, rep counter, form analysis, and dataset pipeline.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS configuration allowing BurnIt frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all modular REST routers
app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(exercises_router)
app.include_router(dataset_router)
app.include_router(model_router)

# WebSocket endpoint for real-time frame streaming and pose telemetry
@app.websocket("/ws/workout/{session_id}")
async def workout_websocket_endpoint(websocket: WebSocket, session_id: str):
    await handle_workout_websocket(websocket, session_id)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "BurnIt Pose Engine",
        "mediapipe_active": pose_detector.use_mediapipe,
        "ml_model_loaded": exercise_classifier.model is not None,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

