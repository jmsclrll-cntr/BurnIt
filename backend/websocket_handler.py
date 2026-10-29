import time
import json
import logging
import cv2
import numpy as np
from fastapi import WebSocket, WebSocketDisconnect
from pose_detector import pose_detector
from angle_utils import extract_joint_angles
from landmark_normalizer import normalize_landmarks, flatten_landmarks_for_ml
from form_checker import FormChecker
from session_manager import session_manager
from exercise_classifier import exercise_classifier
from dataset_recorder import dataset_recorder

logger = logging.getLogger("burnit.ws")

async def handle_workout_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    logger.info("WebSocket connected for workout session: %s", session_id)

    # Initialize or fetch active session state
    session = session_manager.get_or_create_active(session_id, exercise="squat")
    is_processing = False

    try:
        while True:
            # Receive frame: can be binary JPEG or JSON with metadata + base64/binary
            message = await websocket.receive()

            if "bytes" in message and message["bytes"]:
                raw_bytes = message["bytes"]
                metadata = {}
            elif "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                    if payload.get("type") == "change_exercise":
                        new_ex = payload.get("exercise", "squat")
                        session.change_exercise(new_ex)
                        await websocket.send_json({"status": "exercise_changed", "exercise": new_ex})
                        continue
                    elif payload.get("type") == "reset":
                        session.counter.reset()
                        await websocket.send_json({"status": "counter_reset", "rep_count": 0})
                        continue
                    elif payload.get("type") == "pause":
                        session.is_paused = payload.get("paused", True)
                        await websocket.send_json({"status": "pause_toggled", "paused": session.is_paused})
                        continue
                    elif payload.get("type") == "ping":
                        await websocket.send_json({"type": "pong", "time": time.time()})
                        continue
                except Exception:
                    continue
                continue
            else:
                continue

            if session.is_paused:
                continue

            # Drop frame if previous frame is still processing (strictly real-time)
            if is_processing:
                continue

            is_processing = True
            t_start = time.perf_counter()

            try:
                # Decode JPEG frame directly from memory buffer
                np_arr = np.frombuffer(raw_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if frame is None or frame.size == 0:
                    await websocket.send_json({
                        "body_visible": False,
                        "feedback": "Unable to read camera frame.",
                        "landmarks": [],
                        "rep_count": session.counter.rep_count,
                        "phase": session.counter.phase,
                        "form_score": 100,
                        "form_errors": [],
                        "angles": {},
                        "exercise": session.exercise,
                    })
                    continue

                # Run backend MediaPipe Pose Detection
                landmarks = pose_detector.detect(frame)

                if not landmarks or len(landmarks) < 33:
                    await websocket.send_json({
                        "body_visible": False,
                        "feedback": "Step into camera view so your full body is visible.",
                        "landmarks": [],
                        "rep_count": session.counter.rep_count,
                        "phase": session.counter.phase,
                        "form_score": 100,
                        "form_errors": [],
                        "angles": {},
                        "exercise": session.exercise,
                    })
                    continue

                # Visibility Check: Shoulders (11, 12), Hips (23, 24), Knees (25, 26)
                key_indices = [11, 12, 23, 24, 25, 26]
                avg_vis = sum(landmarks[i].get("visibility", 1.0) for i in key_indices) / len(key_indices)

                if avg_vis < 0.48:
                    await websocket.send_json({
                        "body_visible": False,
                        "feedback": "Adjust camera angle; ensure shoulders, hips, and knees are in frame.",
                        "landmarks": landmarks,
                        "rep_count": session.counter.rep_count,
                        "phase": session.counter.phase,
                        "form_score": 100,
                        "form_errors": ["poor_visibility"],
                        "angles": {},
                        "exercise": session.exercise,
                    })
                    continue

                # Compute biometrics
                smoothed_angles = extract_joint_angles(landmarks, smoother=session.smoother)
                norm_landmarks = normalize_landmarks(landmarks)

                # Auto-Detect Exercise classification if requested
                active_exercise = session.exercise
                if active_exercise.lower() in ["auto", "auto_detect", "auto-detect"]:
                    feature_vec = flatten_landmarks_for_ml(norm_landmarks, smoothed_angles)
                    session.feature_history.append(feature_vec)
                    if len(session.feature_history) > 30:
                        session.feature_history.pop(0)
                    detected_exercise = exercise_classifier.classify(session.feature_history, smoothed_angles, landmarks)
                    if detected_exercise != session.counter.__class__.__name__:
                        active_exercise = detected_exercise
                        session.change_exercise(detected_exercise)

                # Update exercise state machine & rep counter
                counter_result = session.counter.update(smoothed_angles, landmarks)
                current_reps = counter_result["rep_count"]
                current_phase = counter_result["phase"]

                # Run per-exercise form evaluation
                eval_result = FormChecker.evaluate(active_exercise, smoothed_angles, landmarks, current_phase)
                form_score = eval_result["form_score"]
                form_errors = eval_result["form_errors"]
                feedback = eval_result["feedback"]

                # Accumulate session statistics
                session.form_scores.append(form_score)
                for err in form_errors:
                    session.error_counts[err] = session.error_counts.get(err, 0) + 1

                # If dataset recording is active for this session, log row
                if session_id in dataset_recorder.active_recordings:
                    dataset_recorder.record_frame(session_id, landmarks, norm_landmarks, smoothed_angles)

                t_elapsed_ms = round((time.perf_counter() - t_start) * 1000.0, 1)
                if t_elapsed_ms > 150.0:
                    logger.warning("Frame processing latency high: %.1f ms", t_elapsed_ms)

                # Reply with complete real-time biometric JSON
                await websocket.send_json({
                    "body_visible": True,
                    "landmarks": landmarks,
                    "exercise": active_exercise,
                    "rep_count": current_reps,
                    "phase": current_phase,
                    "angles": smoothed_angles,
                    "form_score": form_score,
                    "form_errors": form_errors,
                    "feedback": feedback,
                    "processing_time_ms": t_elapsed_ms,
                })

            except Exception as e:
                logger.error("Error processing frame: %s", e)
            finally:
                is_processing = False

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for session: %s", session_id)
    except Exception as e:
        logger.error("WebSocket unexpected termination: %s", e)

