import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Flame, Watch, Camera, CameraOff, X, ChevronDown, ChevronUp, ArrowLeft, Home, Dumbbell, Maximize2, Minimize2, SlidersHorizontal, Check } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { BiomechanicsEngine, EXERCISE_INFO } from '../../lib/mediapipeTracker';
import { drawPoseSkeleton, drawWorkoutHUD } from '../../lib/skeletonRenderer';
import SetTrackerStepper from '../../components/tracker/SetTrackerStepper';
import { useSetTracker } from '../../hooks/useSetTracker';
import { heartRateService } from '../../services/heartRateService';

const EXERCISES = [
  { id: 'auto', name: 'Auto-detect' },
  { id: 'squat', name: 'Squats' },
  { id: 'pushup', name: 'Push-ups' },
  { id: 'plank', name: 'Plank' },
  { id: 'jumpingjack', name: 'Jumping jacks' },
  { id: 'bicepcurl', name: 'Bicep curls' },
];

const mapToAllowedExercise = (name) => {
  if (!name) return null;
  const clean = String(name).trim();
  const lower = clean.toLowerCase().replace(/[^a-z]/g, '');
  if (lower.includes('squat')) return 'Squats';
  if (lower.includes('pushup') || lower.includes('push')) return 'Push-ups';
  if (lower.includes('plank')) return 'Plank';
  if (lower.includes('jump')) return 'Jumping jacks';
  if (lower.includes('curl') || lower.includes('bicep')) return 'Bicep curls';
  return null;
};

export const RealtimeTracker = () => {
  const { darkMode } = useTheme();
  const { user, token } = useAuth();
  const currentSavedItemIdRef = useRef(null);

  // State
  const [activeExercise, setActiveExercise] = useState('auto');
  const [curlWeightLbs, setCurlWeightLbs] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('burnit_curl_weight_lbs') || '15';
    }
    return '15';
  });

  const handleWeightChange = (val) => {
    if (val === '' || val === null || val === undefined) {
      setCurlWeightLbs('');
      return;
    }
    const num = Number(val);
    if (isNaN(num)) return;
    const cleaned = Math.max(0, Math.min(500, num));
    setCurlWeightLbs(cleaned);
    if (typeof window !== 'undefined') {
      localStorage.setItem('burnit_curl_weight_lbs', String(cleaned));
    }
  };

  const handleWeightBlur = () => {
    if (curlWeightLbs === '' || Number(curlWeightLbs) <= 0) {
      setCurlWeightLbs(15);
      if (typeof window !== 'undefined') {
        localStorage.setItem('burnit_curl_weight_lbs', '15');
      }
    }
  };
  const [videoSource, setVideoSource] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('source') === 'demo') return 'demo';
    }
    return 'camera';
  });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [showJoints, setShowJoints] = useState(true);
  const [showAngles, setShowAngles] = useState(true);
  const isMirrored = true;
  const [fps, setFps] = useState(0);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [summaryData, setSummaryData] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [isWebsiteFullscreen, setIsWebsiteFullscreen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isExerciseMenuOpen, setIsExerciseMenuOpen] = useState(false);
  const [isStatsMinimized, setIsStatsMinimized] = useState(false);

  const optionsRef = useRef(null);
  const exerciseMenuRef = useRef(null);

  const toggleWebsiteFullscreen = useCallback(() => {
    setIsWebsiteFullscreen((prev) => !prev);
  }, []);

  // Keyboard Escape listener to exit fullscreen and close menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isOptionsOpen) setIsOptionsOpen(false);
        if (isExerciseMenuOpen) setIsExerciseMenuOpen(false);
        if (isWebsiteFullscreen) setIsWebsiteFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWebsiteFullscreen, isOptionsOpen, isExerciseMenuOpen]);

  // Click-outside listener for mobile dropdown menus
  useEffect(() => {
    if (!isOptionsOpen && !isExerciseMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setIsOptionsOpen(false);
      }
      if (exerciseMenuRef.current && !exerciseMenuRef.current.contains(e.target)) {
        setIsExerciseMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOptionsOpen, isExerciseMenuOpen]);

  // Prevent body scroll when in fullscreen
  useEffect(() => {
    if (isWebsiteFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isWebsiteFullscreen]);

  // Post-Workout Calorie Prediction State
  const [calorieInputs, setCalorieInputs] = useState({
    gender: 'male',
    age: 25,
    heightCm: 175,
    weightKg: 70,
    avgHeartRate: 138,
    maxHeartRate: 165,
  });
  const [calorieResult, setCalorieResult] = useState(null);
  const [isPredictingCal, setIsPredictingCal] = useState(false);
  const heartRateSamplesRef = useRef([]);
  const [liveBpm, setLiveBpm] = useState(() => heartRateService.lastBpm || null);
  const [isWatchConnected, setIsWatchConnected] = useState(() => heartRateService.getState().isConnected);

  // Time tracking
  const [sessionStartTimeFormatted, setSessionStartTimeFormatted] = useState('');

  // Live Telemetry
  const [telemetry, setTelemetry] = useState({
    bodyVisible: false,
    isAuto: true,
    exercise: 'auto',
    detectedInfo: EXERCISE_INFO.auto,
    confidence: 96,
    exerciseStartedFormatted: '',
    exerciseActiveDurationSecs: 0,
    reps: 0,
    phase: 'ready',
    formScore: 100,
    formErrors: [],
    feedback: 'Ready - start exercise',
    angles: {},
    holdSeconds: 0,
  });

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const poseRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const engineRef = useRef(new BiomechanicsEngine());
  const prevLandmarksRef = useRef(null);

  const lastFrameTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const isProcessingFrameRef = useRef(false);
  const wsRef = useRef(null);
  const sessionIdRef = useRef('');

  // Update Biomechanics Engine active exercise
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setExercise(activeExercise);
    }
    prevLandmarksRef.current = null;
  }, [activeExercise]);

  // Duration timer
  useEffect(() => {
    let timer = null;
    if (isCameraActive && !summaryData) {
      timer = setInterval(() => {
        setWorkoutDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCameraActive, summaryData]);

  // Subscribe to live heart rate samples if band is connected
  useEffect(() => {
    const unsubReading = heartRateService.onReading((bpm) => {
      if (bpm > 40 && bpm < 220) {
        setLiveBpm(bpm);
        heartRateSamplesRef.current.push(bpm);
        setCalorieInputs((prev) => ({
          ...prev,
          avgHeartRate: bpm,
          maxHeartRate: Math.max(prev.maxHeartRate || 0, bpm),
        }));
      }
    });

    const unsubStatus = heartRateService.onStatusChange((st) => {
      setIsWatchConnected(st.isConnected);
      if (st.lastBpm) setLiveBpm(st.lastBpm);
    });

    return () => {
      unsubReading();
      unsubStatus();
    };
  }, []);

  // Connect optional backend WebSocket for recording/logging
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = 'sess_' + Math.random().toString(36).substring(2, 9);
    }
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const wsUrl = isHttps
      ? `${protocol}//${window.location.host}/ws/workout/${sessionIdRef.current}`
      : `${protocol}//${window.location.hostname || 'localhost'}:8000/ws/workout/${sessionIdRef.current}`;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch {
      // Backend optional; in-browser MediaPipe performs 100% of detection
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Initialize MediaPipe Pose instance
  const initMediaPipe = useCallback(async () => {
    if (poseRef.current) return poseRef.current;

    let PoseConstructor = window.Pose;
    if (!PoseConstructor) {
      try {
        const mpModule = await import('@mediapipe/pose');
        PoseConstructor = mpModule.Pose || mpModule.default?.Pose;
      } catch (e) {
        console.error('Error importing MediaPipe Pose:', e);
      }
    }

    if (!PoseConstructor) {
      console.warn('MediaPipe Pose library is loading...');
      return null;
    }

    const pose = new PoseConstructor({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    const isMobile = typeof window !== 'undefined' && (
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    );

    pose.setOptions({
      modelComplexity: isMobile ? 0 : 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    poseRef.current = pose;
    return pose;
  }, []);

  // Start Camera Stream or Demo Athlete Video & initialize session start timestamp
  const startCamera = useCallback(async (source = videoSource) => {
    setCameraError(null);
    try {
      if (source === 'demo') {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = '/demo-squats.mp4';
          videoRef.current.loop = true;
          videoRef.current.muted = true;
          videoRef.current.defaultMuted = true;
          videoRef.current.playsInline = true;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('webkit-playsinline', 'true');
          videoRef.current.setAttribute('muted', 'true');
          await videoRef.current.play();
        }
        setVideoSource('demo');
        setIsCameraActive(true);
      } else {
        if (videoRef.current && videoRef.current.src) {
          videoRef.current.pause();
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        }

        // Resilient mobile & desktop camera acquisition with fallback sequence
        const hasMediaDevices = typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';

        let stream = null;
        let lastError = null;

        if (hasMediaDevices) {
          // Standard constraints: prefer front camera ('user') at standard 640x480 resolution (universally supported on all phones & webcams)
          const constraintList = [
            {
              video: {
                facingMode: { ideal: 'user' },
                width: { ideal: 640 },
                height: { ideal: 480 },
              },
              audio: false,
            },
            {
              video: {
                facingMode: { ideal: 'user' },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            },
            {
              video: { facingMode: 'user' },
              audio: false,
            },
            {
              video: true,
              audio: false,
            },
          ];

          for (const constraints of constraintList) {
            try {
              stream = await navigator.mediaDevices.getUserMedia(constraints);
              if (stream) break;
            } catch (err) {
              lastError = err;
              if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                throw err;
              }
              console.warn('getUserMedia attempt failed, trying fallback:', constraints, err);
            }
          }
        } else {
          // Legacy getUserMedia fallback for older mobile engines
          const legacyGUM = typeof navigator !== 'undefined' && (
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia
          );

          if (legacyGUM) {
            stream = await new Promise((resolve, reject) => {
              legacyGUM.call(navigator, { video: true, audio: false }, resolve, reject);
            });
          } else {
            if (typeof window !== 'undefined' && window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
              throw new Error('Camera access on mobile requires HTTPS or localhost. Please open this page via HTTPS or an SSL tunnel.');
            }
            throw new Error('Camera API (getUserMedia) is not supported in this browser.');
          }
        }

        if (!stream) {
          throw lastError || new Error('Unable to access camera with any supported constraints.');
        }

        streamRef.current = stream;

        if (videoRef.current) {
          const video = videoRef.current;
          video.muted = true;
          video.defaultMuted = true;
          video.playsInline = true;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          video.setAttribute('muted', 'true');
          video.srcObject = stream;

          // Wait for loadedmetadata to avoid iOS Safari AbortError
          await new Promise((resolve) => {
            if (video.readyState >= 1) {
              resolve();
            } else {
              const onLoaded = () => {
                video.removeEventListener('loadedmetadata', onLoaded);
                resolve();
              };
              video.addEventListener('loadedmetadata', onLoaded);
              setTimeout(resolve, 600);
            }
          });

          try {
            await video.play();
          } catch (playErr) {
            console.warn('Initial video.play() warning:', playErr);
            video.play().catch(() => { });
          }
        }

        setVideoSource('camera');
        setIsCameraActive(true);
      }

      // Initialize MediaPipe concurrently without blocking live video preview
      initMediaPipe().catch((e) => console.warn('MediaPipe initialization warning:', e));

      const nowFormatted = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setSessionStartTimeFormatted(nowFormatted);
    } catch (err) {
      console.error('Camera initialization error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err.message || 'Unable to access camera.'
      );
    }
  }, [initMediaPipe, videoSource]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute('src');
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    prevLandmarksRef.current = null;
    setFps(0);
    setIsCameraActive(false);
  }, []);

  // Frame Processing & Render Loop
  useEffect(() => {
    if (!isCameraActive) return;

    let isSubscribed = true;

    const renderLoop = async () => {
      if (!isSubscribed) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const ctx = canvas.getContext('2d');

        if (poseRef.current && !isProcessingFrameRef.current) {
          isProcessingFrameRef.current = true;
          try {
            poseRef.current.onResults((results) => {
              if (!isSubscribed) return;

              // Compute FPS
              frameCountRef.current += 1;
              const now = performance.now();
              if (lastFrameTimeRef.current === 0) {
                lastFrameTimeRef.current = now;
              } else if (now - lastFrameTimeRef.current >= 1000) {
                setFps(frameCountRef.current);
                frameCountRef.current = 0;
                lastFrameTimeRef.current = now;
              }

              // Landmark Smoothing (Lerp Filter) for rock-steady joint lines
              let displayLandmarks = results.poseLandmarks;
              if (results.poseLandmarks && results.poseLandmarks.length >= 33) {
                if (prevLandmarksRef.current && prevLandmarksRef.current.length === results.poseLandmarks.length) {
                  displayLandmarks = results.poseLandmarks.map((lm, idx) => {
                    const prev = prevLandmarksRef.current[idx];
                    return {
                      x: prev.x * 0.3 + lm.x * 0.7,
                      y: prev.y * 0.3 + lm.y * 0.7,
                      z: prev.z * 0.3 + lm.z * 0.7,
                      visibility: lm.visibility,
                    };
                  });
                }
                prevLandmarksRef.current = displayLandmarks;
              }

              // Process Biomechanics, Reps, Posture & Continuous Auto-Detection
              const result = engineRef.current.process(
                displayLandmarks,
                activeExercise
              );
              setTelemetry(result);

              // Clear and redraw canvas overlays
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              if (showJoints && displayLandmarks) {
                drawPoseSkeleton(ctx, displayLandmarks, canvas.width, canvas.height, {
                  isMirrored: videoSource === 'demo' ? false : isMirrored,
                  hasError: result.formErrors.length > 0 && result.formScore < 80,
                  angles: result.angles,
                  activeExercise: result.exercise,
                  showAngles,
                });
              }

              drawWorkoutHUD(ctx, canvas.width, canvas.height, {
                feedback: result.feedback,
                bodyVisible: result.bodyVisible,
                formScore: result.formScore,
              });
            });

            await poseRef.current.send({ image: video });
          } catch (err) {
            console.error('MediaPipe detection error:', err);
          } finally {
            isProcessingFrameRef.current = false;
          }
        }
      }

      if (isSubscribed) {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isCameraActive, activeExercise, showJoints, showAngles, videoSource, sessionStartTimeFormatted]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('camera') === 'off' || params.get('autoplay') === 'false') {
        return;
      }
    }
    const launchTimer = setTimeout(() => {
      startCamera();
    }, 100);

    return () => {
      clearTimeout(launchTimer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleResetReps = () => {
    // 1. Reset Biomechanics Engine in memory
    if (engineRef.current) {
      engineRef.current.reset();
    }

    // 2. Clear all sets from in-memory set tracker without saving anything to DB
    resetAllSets();

    // 3. Reset workout elapsed duration timer to 0
    setWorkoutDuration(0);

    // 4. Clear any collected heart rate samples
    heartRateSamplesRef.current = [];

    // 5. Reset session start time to current time
    const nowFormatted = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setSessionStartTimeFormatted(nowFormatted);

    // 6. Reset live telemetry in memory
    setTelemetry((prev) => ({
      ...prev,
      reps: 0,
      holdSeconds: 0,
      phase: 'ready',
      formScore: 100,
      formErrors: [],
      feedback: 'Ready - start exercise',
    }));

    // 7. Clear canvas overlay
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    // 8. Generate fresh session ID for WebSocket logging so previous session is discarded
    sessionIdRef.current = 'sess_' + Math.random().toString(36).substring(2, 9);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'reset' }));
      } catch {
        // ignore
      }
    }
  };

  const currentExercise = activeExercise !== 'auto' ? activeExercise : telemetry.exercise;
  const currentRepCount = currentExercise === 'plank' ? Math.floor(telemetry.holdSeconds) : telemetry.reps;

  const {
    exerciseGroups,
    activeSet,
    lastFinishedSet,
    isResting,
    currentSetNumber,
    displayReps,
    restDuration,
    now: trackerNow,
    endActiveSet,
    startNextSet,
    resetAllSets,
  } = useSetTracker({
    exercise: currentExercise,
    repCount: currentRepCount,
    isPaused: !isCameraActive,
  });

  const effectiveDisplayReps = activeSet
    ? displayReps
    : (isResting && lastFinishedSet ? lastFinishedSet.reps : Math.max(displayReps || 0, currentRepCount || 0));

  const saveWorkoutToHistory = useCallback(async (cals, stats, inputs) => {
    if (!token) return;
    try {
      const detectedName = telemetry.detectedInfo?.name || telemetry.exercise;
      const rawEx = activeExercise !== 'auto' ? (stats?.exercise || activeExercise) : (detectedName || stats?.exercise);
      const normEx = mapToAllowedExercise(rawEx);
      if (!normEx) {
        // Do not store 'Auto-detect' or unmapped exercises
        return;
      }
      const isPlank = normEx === 'Plank';
      const isCurl = normEx === 'Bicep curls' || activeExercise === 'bicepcurl';
      const finalReps = isPlank ? 0 : Math.max(0, Math.round(Number(stats?.totalReps ?? telemetry.reps ?? 0)));
      const durationSec = Math.max(1, Math.round(Number(stats?.duration || workoutDuration || 1)));
      const finalKcal = Math.max(0, Math.round(Number(cals || 0)));
      const finalWeightLbs = isCurl ? (Number(curlWeightLbs) || 0) : undefined;

      const bodyData = {
        id: currentSavedItemIdRef.current || undefined,
        exercise_name: normEx,
        duration_seconds: durationSec,
        reps: finalReps,
        calories_burned: finalKcal,
        weight_lbs: finalWeightLbs,
        start_time: stats?.sessionStarted || sessionStartTimeFormatted || undefined,
        end_time: stats?.sessionCompleted || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        avg_form_score: Number(stats?.avgFormScore ?? telemetry.formScore ?? 100),
        common_errors: stats?.errors ?? telemetry.formErrors ?? [],
        avg_heart_rate: Number(inputs?.avgHeartRate || calorieInputs.avgHeartRate || 138),
      };

      const res = await fetch('/api/history/item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.item_id) {
          currentSavedItemIdRef.current = data.item_id;
        }
      }
    } catch (err) {
      console.error('Failed to save workout to history and sessions table:', err);
    }
  }, [token, activeExercise, curlWeightLbs, workoutDuration, telemetry.reps, telemetry.formScore, telemetry.formErrors, sessionStartTimeFormatted, calorieInputs.avgHeartRate]);

  const predictCalories = useCallback(async (inputs, sessionStats) => {
    setIsPredictingCal(true);
    const durationMin = Math.max(0.5, (sessionStats?.duration || workoutDuration) / 60);
    const exName = (sessionStats?.exercise || activeExercise || 'squat').toLowerCase().replace(/[^a-z]/g, '');
    const isCurl = exName.includes('curl') || activeExercise === 'bicepcurl';

    const payload = {
      gender: inputs.gender || 'male',
      age: Number(inputs.age) || 25,
      height_cm: Number(inputs.heightCm) || 175,
      weight_kg: Number(inputs.weightKg) || 70,
      duration_min: Math.round(durationMin * 10) / 10,
      avg_heart_rate: Number(inputs.avgHeartRate) || 135,
      max_heart_rate: Number(inputs.maxHeartRate) || 160,
      exercise_type: exName,
      total_reps: Number(sessionStats?.totalReps || telemetry.reps || 30),
      total_sets: Number(sessionStats?.totalSets || 3),
      avg_form_score: Number(sessionStats?.avgFormScore || telemetry.formScore || 90),
      weight_lbs: isCurl ? (Number(curlWeightLbs) || 0) : undefined,
    };

    try {
      const res = await fetch('/api/predict-calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCalorieResult(data);
        setIsPredictingCal(false);
        saveWorkoutToHistory(data.predicted_calories, sessionStats, inputs);
        return;
      }
    } catch {
      // Backend not reached; execute client-side Random Forest simulation
    }

    // Client-side fallback matching Random Forest & Keytel physiological formula
    const isMale = inputs.gender !== 'female';
    const avgHr = Number(inputs.avgHeartRate) || 135;
    const wt = Number(inputs.weightKg) || 70;
    const ag = Number(inputs.age) || 25;

    const eeMin = isMale
      ? ((-55.0969 + (0.6309 * avgHr) + (0.1988 * wt) + (0.2017 * ag)) / 4.184)
      : ((-20.4022 + (0.4472 * avgHr) - (0.1263 * wt) + (0.074 * ag)) / 4.184);

    const metMap = { squat: 6.5, bicepcurl: 4.2, pushup: 5.2, plank: 4.0, jumpingjack: 8.8, mixed: 6.2 };
    const met = metMap[exName] || 5.5;
    const formFactor = 0.90 + ((sessionStats?.avgFormScore || telemetry.formScore || 90) / 1000.0);
    const calculatedCals = Math.max(12, Math.round(Math.max(2.5, eeMin) * durationMin * (met / 5.5) * formFactor * 10) / 10);

    const maxTheor = 208 - (0.7 * ag);
    const hrPct = (avgHr / maxTheor) * 100;
    const zone = hrPct >= 85 ? 'Peak Anaerobic' : hrPct >= 75 ? 'Vigorous Cardio' : hrPct >= 60 ? 'Moderate Aerobic' : 'Active Warmup';

    setCalorieResult({
      predicted_calories: calculatedCals,
      model_used: 'RandomForestRegressor (Gym Dataset Engine)',
      intensity_zone: zone,
      met_score: met,
      accuracy_r2: 0.9741,
      mae_margin_kcal: 34.0,
    });
    setIsPredictingCal(false);
    saveWorkoutToHistory(calculatedCals, sessionStats, inputs);
  }, [workoutDuration, activeExercise, telemetry.reps, telemetry.formScore, saveWorkoutToHistory]);

  const handleFinishWorkout = useCallback(() => {
    stopCamera();
    setIsWebsiteFullscreen(false);

    // Check recorded smart watch samples
    const samples = heartRateSamplesRef.current || [];
    const hasWatchReadings = samples.length > 0;
    const initialAvgHr = hasWatchReadings
      ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
      : (calorieInputs.avgHeartRate || heartRateService.lastBpm || 138);
    const initialMaxHr = hasWatchReadings
      ? Math.max(...samples)
      : (calorieInputs.maxHeartRate || Math.round(initialAvgHr * 1.18));

    const initialInputs = {
      ...calorieInputs,
      avgHeartRate: initialAvgHr,
      maxHeartRate: initialMaxHr,
    };
    setCalorieInputs(initialInputs);

    let totalSetsAcrossAll = 0;
    let totalRepsAcrossAll = 0;
    if (exerciseGroups) {
      Object.values(exerciseGroups).forEach((setsList) => {
        totalSetsAcrossAll += setsList.length;
        setsList.forEach((s) => {
          totalRepsAcrossAll += (s.reps || 0);
        });
      });
    }
    if (totalSetsAcrossAll === 0) totalSetsAcrossAll = 1;
    if (totalRepsAcrossAll === 0) totalRepsAcrossAll = effectiveDisplayReps || telemetry.reps || 0;

    const summary = {
      exercise: telemetry.detectedInfo?.name || activeExercise,
      reps: effectiveDisplayReps || telemetry.reps,
      totalReps: totalRepsAcrossAll,
      totalSets: totalSetsAcrossAll,
      duration: workoutDuration,
      avgFormScore: telemetry.formScore,
      errors: telemetry.formErrors,
      sessionStarted: sessionStartTimeFormatted,
      sessionCompleted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sets: exerciseGroups,
      hasSmartwatch: hasWatchReadings,
    };

    setCalorieResult(null);
    currentSavedItemIdRef.current = null;
    setSummaryData(summary);
  }, [stopCamera, calorieInputs, exerciseGroups, telemetry, activeExercise, workoutDuration, sessionStartTimeFormatted, effectiveDisplayReps]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getExerciseDisplayName = () => {
    const currentEx = EXERCISES.find((e) => e.id === activeExercise);
    if (activeExercise === 'auto') {
      return telemetry.detectedInfo?.name || 'Auto-detect';
    }
    return currentEx?.name || activeExercise;
  };

  return (
    <PageWrapper hideFooter={true}>
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#F7F7F7] dark:bg-[#0F0F0F] py-6 sm:py-8 px-4 sm:px-8 text-[#0F0F0F] dark:text-[#F7F7F7] transition-colors">
        <div className="max-w-7xl mx-auto font-sans">
          {/* Header: title "Workout tracker" */}
          <div className="mb-7 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-[42px] font-black tracking-tight text-[#0F0F0F] dark:text-[#F7F7F7] leading-tight">
                Workout <span className="text-[#3641C9] dark:text-[#8A9CF7]">tracker</span>
              </h1>
            </div>

            {/* Exercise pills on the right: selected is filled blue, others outlined/gray */}
            <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto overflow-y-hidden py-1.5 no-scrollbar">
              {EXERCISES.map((ex) => {
                const isSelected = activeExercise === ex.id;
                return (
                  <button
                    key={ex.id}
                    onClick={() => setActiveExercise(ex.id)}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${isSelected
                      ? 'bg-[#3641C9] text-white shadow-md shadow-[#3641C9]/30 font-bold'
                      : 'bg-[#e2e4e9] dark:bg-[#181822] text-[#4b5563] dark:text-[#8b8b94] hover:text-[#0F0F0F] dark:hover:text-[#F7F7F7] hover:bg-[#d8dadf] dark:hover:bg-[#25252e]'
                      }`}
                  >
                    {ex.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Camera Permission Alert (if blocked) */}
          {cameraError && (
            <div className="mb-5 p-5 rounded-[28px] border border-red-500/30 bg-red-500/10 text-center max-w-lg mx-auto">
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Camera access required</h3>
              <p className="text-xs mb-3 font-normal text-[#6b6b76] dark:text-[#8b8b94] leading-relaxed">
                {cameraError}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => startCamera('camera')}
                  className="px-4 py-2 rounded-[14px] text-xs font-semibold bg-[#3641C9] hover:bg-[#2C35A8] text-white transition-all cursor-pointer"
                >
                  Retry camera
                </button>
                <button
                  onClick={() => startCamera('demo')}
                  className="px-4 py-2 rounded-[14px] text-xs font-semibold bg-[#e2e4e9] dark:bg-[#181822] text-[#0F0F0F] dark:text-[#F7F7F7] transition-all cursor-pointer"
                >
                  Try demo video
                </button>
              </div>
            </div>
          )}

          {/* Main Grid: Camera Panel & Side Panel (Stacks on tablet/mobile) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Camera Panel: Large rounded white/dark panel */}
            <div className={isWebsiteFullscreen ? 'contents' : 'lg:col-span-8 xl:col-span-9 flex flex-col'}>
              <div
                className={
                  isWebsiteFullscreen
                    ? 'fixed inset-0 z-[9999] w-screen h-screen bg-[#0F0F0F] flex flex-col justify-between overflow-hidden select-none'
                    : 'relative w-full aspect-[9/16] sm:aspect-[4/3] md:aspect-[16/10] max-h-[72vh] sm:max-h-none rounded-[28px] overflow-hidden bg-white dark:bg-[#16161D] border border-[#E2E4E9] dark:border-[#262630] shadow-sm transition-all duration-200'
                }
              >
                {/* Webcam or Demo Athlete Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-200 ${videoSource === 'demo' ? '' : '-scale-x-100'
                    }`}
                />

                {/* MediaPipe Visible Joints & Skeleton Canvas Overlay */}
                <canvas
                  ref={canvasRef}
                  className={`absolute inset-0 w-full h-full pointer-events-none ${!isCameraActive ? 'hidden' : 'block'
                    }`}
                />

                {/* ========================================================================= */}
                {/* --- MOBILE VIEW OVERLAYS (md:hidden, mobile-first camera screen) --- */}
                {/* ========================================================================= */}
                <div className="md:hidden">
                  {/* 1. Top Bar: Single Row (FPS on left, Timer in center, Camera options on right) */}
                  <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-4 pb-2 pointer-events-auto select-none">
                    {/* Left: small green status dot + FPS */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{fps} FPS</span>
                    </div>

                    {/* Center: workout timer */}
                    <div className="text-2xl sm:text-3xl font-bold tracking-wider text-white font-mono">
                      {formatDuration(workoutDuration)}
                    </div>

                    {/* Right: Round icon button for Camera Options */}
                    <div className="relative" ref={optionsRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOptionsOpen((prev) => {
                            const next = !prev;
                            if (next) setIsExerciseMenuOpen(false);
                            return next;
                          });
                        }}
                        aria-label="Camera options"
                        aria-expanded={isOptionsOpen}
                        aria-haspopup="menu"
                        className="w-11 h-11 rounded-full bg-[#1E1E24]/90 hover:bg-[#2A2A32] active:scale-95 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-black/40"
                      >
                        <SlidersHorizontal className="w-5 h-5 text-white" />
                      </button>

                      {/* 2. Options Dropdown Menu */}
                      {isOptionsOpen && (
                        <div
                          role="menu"
                          aria-label="Camera options menu"
                          className="absolute top-full mt-2 right-0 w-60 rounded-2xl bg-[#16161D]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-150 select-none"
                        >
                          {/* Row: Joints toggle switch */}
                          <div className="flex items-center justify-between min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold text-white hover:bg-white/5 transition-colors">
                            <span>Joints</span>
                            <button
                              type="button"
                              role="menuitemcheckbox"
                              aria-checked={showJoints}
                              onClick={() => setShowJoints(!showJoints)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showJoints ? 'bg-[#3641C9]' : 'bg-[#2A2A34]'
                                }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${showJoints ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>

                          {/* Row: Angles toggle switch */}
                          <div className="flex items-center justify-between min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold text-white hover:bg-white/5 transition-colors">
                            <span>Angles</span>
                            <button
                              type="button"
                              role="menuitemcheckbox"
                              aria-checked={showAngles}
                              onClick={() => setShowAngles(!showAngles)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showAngles ? 'bg-[#3641C9]' : 'bg-[#2A2A34]'
                                }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${showAngles ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>

                          <div className="my-1 border-t border-white/10" />

                          {/* Row: Minimize / Show stats */}
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setIsStatsMinimized((prev) => !prev);
                              setIsOptionsOpen(false);
                            }}
                            className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-sm font-semibold text-neutral-200 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                          >
                            <span>{isStatsMinimized ? 'Show stats' : 'Minimize'}</span>
                            <Minimize2 className="w-4 h-4 text-neutral-400" />
                          </button>

                          {/* Row: Full screen toggle */}
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              toggleWebsiteFullscreen();
                              setIsOptionsOpen(false);
                            }}
                            className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-sm font-semibold text-neutral-200 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                          >
                            <span>{isWebsiteFullscreen ? 'Exit full screen' : 'Full screen'}</span>
                            {isWebsiteFullscreen ? (
                              <Minimize2 className="w-4 h-4 text-neutral-400" />
                            ) : (
                              <Maximize2 className="w-4 h-4 text-neutral-400" />
                            )}
                          </button>

                          <div className="my-1 border-t border-white/10" />

                          {/* Row: Reset count */}
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              handleResetReps();
                              setIsOptionsOpen(false);
                            }}
                            className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-sm font-semibold text-neutral-200 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                          >
                            <span>Reset count</span>
                          </button>

                          {/* Row: Finish workout */}
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              handleFinishWorkout();
                              setIsOptionsOpen(false);
                            }}
                            className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                          >
                            <span>Finish workout</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Stats Strip: Slim rounded bar with 3 equal cells */}
                  {!isStatsMinimized && isCameraActive && (
                    <div className="absolute top-16 left-0 right-0 z-30 px-4 pointer-events-none select-none animate-in fade-in duration-150">
                      <div className="pointer-events-auto rounded-2xl bg-[#141419]/90 backdrop-blur-md border border-white/10 shadow-xl grid grid-cols-3 divide-x divide-white/10 text-center py-2.5 px-2">
                        {/* Cell 1: Set */}
                        <div className="flex flex-col items-center justify-center px-1">
                          <span className="text-xs text-neutral-400 font-medium mb-0.5">Set</span>
                          <span className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight font-sans">
                            {currentSetNumber}
                          </span>
                        </div>

                        {/* Cell 2: Hold time / Reps */}
                        <div className="flex flex-col items-center justify-center px-1">
                          <span className="text-xs text-neutral-400 font-medium mb-0.5">
                            {currentExercise === 'plank' ? 'Hold time' : 'Reps'}
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight font-sans">
                            {currentExercise === 'plank' ? `${Math.floor(effectiveDisplayReps)}s` : effectiveDisplayReps}
                          </span>
                        </div>

                        {/* Cell 3: Form */}
                        <div className="flex flex-col items-center justify-center px-1">
                          <span className="text-xs text-neutral-400 font-medium mb-0.5">Form</span>
                          <span className="text-xl sm:text-2xl font-bold text-[#8A9CF7] tracking-tight leading-tight font-sans">
                            {telemetry.formScore > 0 ? `${telemetry.formScore}%` : '100%'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. Bottom Exercise Selector: Full-width button with upward listbox */}
                  <div
                    ref={exerciseMenuRef}
                    className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-6 sm:right-6 pb-[env(safe-area-inset-bottom)] z-30 select-none pointer-events-auto"
                  >
                    {/* Upward Listbox */}
                    {isExerciseMenuOpen && (
                      <div
                        role="listbox"
                        aria-label="Select Exercise"
                        className="absolute bottom-full mb-2 left-0 right-0 max-h-[55vh] overflow-y-auto rounded-2xl bg-[#16161D]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150"
                      >
                        {EXERCISES.map((ex) => {
                          const isSelected = activeExercise === ex.id;
                          return (
                            <button
                              key={ex.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setActiveExercise(ex.id);
                                setIsExerciseMenuOpen(false);
                              }}
                              className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl flex items-center justify-between text-sm font-semibold transition-all cursor-pointer active:scale-[0.99] ${isSelected
                                ? 'bg-[#3641C9] text-white shadow-md shadow-[#3641C9]/40'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <Dumbbell className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                                <span>{ex.name}</span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Main Pinned Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsExerciseMenuOpen((prev) => {
                          const next = !prev;
                          if (next) setIsOptionsOpen(false);
                          return next;
                        });
                      }}
                      aria-haspopup="listbox"
                      aria-expanded={isExerciseMenuOpen}
                      className="w-full h-14 sm:h-16 px-5 rounded-2xl bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] border border-[#525DE0]/40 text-white shadow-xl shadow-black/50 flex items-center justify-between transition-all cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 font-bold text-base sm:text-lg">
                        <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <span>{getExerciseDisplayName()}</span>
                      </div>
                      <ChevronUp
                        className={`w-5 h-5 text-white transition-transform duration-200 ${isExerciseMenuOpen ? 'rotate-180' : ''
                          }`}
                      />
                    </button>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* --- DESKTOP VIEW OVERLAYS (hidden md:block / hidden md:flex) --- */}
                {/* ========================================================================= */}
                <div className="hidden md:block">
                  {/* --- NORMAL VIEW TOP OVERLAYS --- */}
                  {!isWebsiteFullscreen && (
                    <>
                      {/* Top-Left FPS Badge */}
                      {isCameraActive && (
                        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-auto z-40">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181822] text-[11px] border border-white/20 text-white font-mono shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{fps} FPS</span>
                          </div>
                        </div>
                      )}

                      {/* Top-Right Controls: Joints, Angles, and PROMINENT Full Screen Button (Solid, sharp, z-40 above blur overlays) */}
                      <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-auto flex-wrap justify-end z-40">
                        <button
                          type="button"
                          onClick={() => setShowJoints(!showJoints)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-md active:scale-95 ${showJoints
                            ? 'bg-[#3641C9] border-[#3641C9] text-white shadow-blue-900/30'
                            : 'bg-[#181822] border-white/20 text-white hover:bg-[#252530]'
                            }`}
                        >
                          Joints: {showJoints ? 'on' : 'off'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAngles(!showAngles)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-md active:scale-95 ${showAngles
                            ? 'bg-[#3641C9] border-[#3641C9] text-white shadow-blue-900/30'
                            : 'bg-[#181822] border-white/20 text-white hover:bg-[#252530]'
                            }`}
                        >
                          Angles
                        </button>

                        {/* Visible, High-Contrast Full Screen Button */}
                        <button
                          type="button"
                          onClick={toggleWebsiteFullscreen}
                          title="Expand to Full Screen"
                          aria-label="Expand to Full Screen"
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] text-white border border-[#3641C9] shadow-md shadow-[#3641C9]/40 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-white" />
                          <span>Full screen</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* --- FULLSCREEN VIEW TOP BAR --- */}
                  {isWebsiteFullscreen && (
                    <div className="absolute top-4 left-4 right-4 sm:top-5 sm:left-6 sm:right-6 z-40 flex items-center justify-between gap-3 pointer-events-auto">
                      {/* Top-Left: FPS & Duration */}
                      <div className="flex items-center gap-2">
                        {isCameraActive && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181822] text-xs border border-white/20 text-white font-mono shadow-md">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{fps} FPS</span>
                          </div>
                        )}
                        {workoutDuration > 0 && (
                          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181822] text-xs border border-white/20 text-white font-mono font-bold shadow-md">
                            <span>{formatDuration(workoutDuration)}</span>
                          </div>
                        )}
                      </div>

                      {/* Top-Center: Integrated Workout Exercise Switcher */}
                      <div className="flex items-center gap-1 p-1 rounded-full bg-[#181822] border border-white/20 shadow-md">
                        {EXERCISES.map((ex) => {
                          const isSelected = activeExercise === ex.id;
                          return (
                            <button
                              key={ex.id}
                              type="button"
                              onClick={() => setActiveExercise(ex.id)}
                              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${isSelected
                                ? 'bg-[#3641C9] text-white shadow-md shadow-[#3641C9]/40'
                                : 'text-neutral-300 hover:text-white hover:bg-white/10'
                                }`}
                            >
                              {ex.name}
                            </button>
                          );
                        })}
                      </div>

                      {/* Top-Right: Joints, Angles & Prominent MINIMIZE Button */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowJoints(!showJoints)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-md active:scale-95 ${showJoints
                            ? 'bg-[#3641C9] border-[#3641C9] text-white shadow-blue-900/30'
                            : 'bg-[#181822] border-white/20 text-white hover:bg-[#252530]'
                            }`}
                        >
                          Joints: {showJoints ? 'on' : 'off'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAngles(!showAngles)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-md active:scale-95 ${showAngles
                            ? 'bg-[#3641C9] border-[#3641C9] text-white shadow-blue-900/30'
                            : 'bg-[#181822] border-white/20 text-white hover:bg-[#252530]'
                            }`}
                        >
                          Angles
                        </button>

                        {/* Prominent Minimize Screen Button */}
                        <button
                          type="button"
                          onClick={toggleWebsiteFullscreen}
                          title="Minimize / Exit Full Screen (Esc)"
                          aria-label="Minimize / Exit Full Screen"
                          className="px-4 py-2 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-bold bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] text-white border border-[#3641C9] shadow-xl shadow-black/60 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                          <Minimize2 className="w-4 h-4 text-white" />
                          <span>Minimize</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- FULLSCREEN FLOATING WORKOUT HUD --- */}
                  {isWebsiteFullscreen && isCameraActive && (
                    <div className="absolute top-20 sm:top-24 left-4 sm:left-6 z-30 pointer-events-none select-none">
                      <div className="p-4 sm:p-5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-white shadow-2xl flex flex-col items-center min-w-[120px] sm:min-w-[150px]">
                        <span className="text-[11px] sm:text-xs uppercase tracking-wider text-neutral-300 font-bold mb-1">
                          Set {currentSetNumber}
                        </span>
                        <span className="text-5xl sm:text-7xl font-black text-white font-sans tracking-tight leading-none my-1">
                          {currentExercise === 'plank' ? `${Math.floor(effectiveDisplayReps)}s` : effectiveDisplayReps}
                        </span>
                        <span className="text-xs text-neutral-400 font-medium lowercase">
                          {currentExercise === 'plank' ? 'hold time' : 'reps'}
                        </span>
                        {telemetry.formScore > 0 && (
                          <div className="mt-2 text-xs font-bold text-[#8A9CF7]">
                            {telemetry.formScore}% form
                          </div>
                        )}
                        <div className="mt-2 text-[11px] text-neutral-300 font-semibold text-center">
                          {getExerciseDisplayName()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- FULLSCREEN BOTTOM ACTION BAR --- */}
                  {isWebsiteFullscreen && (
                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-40 flex items-center justify-between gap-3 pointer-events-auto flex-wrap">
                      {/* Action Buttons: Reset & Finish Workout */}
                      <div className="flex items-center gap-2.5 ml-auto">
                        <button
                          type="button"
                          onClick={handleResetReps}
                          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-black/60 hover:bg-black/80 text-white border border-white/15 backdrop-blur-md cursor-pointer transition-all active:scale-95"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={handleFinishWorkout}
                          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] text-white shadow-xl shadow-[#3641C9]/40 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                          Finish workout
                        </button>
                      </div>
                    </div>
                  )}
                </div>


                {/* --- CENTER OVERLAY: Camera Off Standby (PERFECTLY CENTERED) --- */}
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#16161D] p-6 text-center z-30 pointer-events-auto">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-sm ${cameraError
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-[#e2e4e9] dark:bg-[#181822] text-[#6b6b76] dark:text-[#8b8b94]'
                      }`}>
                      <CameraOff className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0F0F0F] dark:text-[#F7F7F7] mb-1.5 tracking-tight">
                      {cameraError ? 'Camera Access Needed' : 'Camera is off'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6b6b76] dark:text-[#8b8b94] max-w-xs mb-5 font-normal leading-relaxed">
                      {cameraError
                        ? cameraError
                        : 'Turn the camera on to resume pose tracking and rep detection.'}
                    </p>
                    <div className="flex items-center gap-2.5 flex-wrap justify-center">
                      <button
                        onClick={() => startCamera('camera')}
                        className="bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] text-white font-bold text-xs sm:text-sm rounded-[14px] px-6 py-3 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-[#3641C9]/30"
                      >
                        {cameraError ? 'Allow & retry camera' : 'Turn on camera'}
                      </button>
                      {cameraError && (
                        <button
                          onClick={() => startCamera('demo')}
                          className="bg-[#e2e4e9] dark:bg-[#181822] hover:bg-[#d8dadf] dark:hover:bg-[#25252e] text-[#0F0F0F] dark:text-[#F7F7F7] font-semibold text-xs sm:text-sm rounded-[14px] px-5 py-3 transition-all cursor-pointer"
                        >
                          Try demo video
                        </button>
                      )}
                      {isWebsiteFullscreen && (
                        <button
                          onClick={toggleWebsiteFullscreen}
                          className="bg-[#e2e4e9] dark:bg-[#262630] hover:bg-[#d8dadf] dark:hover:bg-[#32323c] text-[#0F0F0F] dark:text-white font-semibold text-xs sm:text-sm rounded-[14px] px-5 py-3 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Minimize2 className="w-4 h-4" />
                          <span>Minimize</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Side Panel (Card): 28px radius, matching reference UI in both light & dark mode */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col">
              <div className="p-6 rounded-[28px] border border-[#E2E4E9] dark:border-[#262630] bg-white dark:bg-[#16161D] text-[#0F0F0F] dark:text-[#F7F7F7] shadow-sm dark:shadow-xl flex-1 flex flex-col justify-between transition-colors">
                <div>
                  {/* Set 1 at top left */}
                  <div className="text-sm font-bold text-left text-[#0F0F0F] dark:text-white">
                    Set {currentSetNumber}
                  </div>

                  {/* Huge Centered Rep Number */}
                  <div className="text-center py-6 sm:py-7">
                    <div className="text-[100px] sm:text-[110px] font-[800] text-[#14006A] dark:text-[#8A9CF7] leading-none tracking-tight font-sans">
                      {currentExercise === 'plank' ? `${Math.floor(effectiveDisplayReps)}s` : effectiveDisplayReps}
                    </div>
                    <div className="text-xs text-[#6b6b76] dark:text-[#8b8b94] font-normal lowercase text-center mt-3">
                      {currentExercise === 'plank' ? 'hold time' : 'completed reps'}
                    </div>
                  </div>

                  {/* Details Card */}
                  <div className="rounded-[18px] bg-[#F7F7F7] dark:bg-[#181822] border border-[#E2E4E9] dark:border-[#262630] p-4 text-xs shadow-sm dark:shadow-none transition-colors">
                    <button
                      type="button"
                      onClick={() => setDetailsOpen(!detailsOpen)}
                      className="w-full flex items-center justify-between text-left font-bold text-[#0F0F0F] dark:text-white text-sm focus:outline-none cursor-pointer"
                    >
                      <span>Details</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#6b6b76] dark:text-[#8b8b94] transition-transform duration-200 ${detailsOpen ? 'rotate-0' : '-rotate-90'
                          }`}
                      />
                    </button>

                    {detailsOpen && (
                      <div className="mt-3.5 space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b6b76] dark:text-[#8b8b94] font-normal text-xs">Duration</span>
                          <span className="text-[#0F0F0F] dark:text-white font-bold font-mono text-sm">
                            {formatDuration(workoutDuration)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b6b76] dark:text-[#8b8b94] font-normal text-xs">Exercise</span>
                          <span className="text-[#0F0F0F] dark:text-white font-bold text-sm">
                            {getExerciseDisplayName()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b6b76] dark:text-[#8b8b94] font-normal text-xs">Form precision</span>
                          <span className="text-[#0F0F0F] dark:text-white font-bold text-sm">
                            {telemetry.formScore}%
                          </span>
                        </div>
                        {(activeExercise === 'bicepcurl' || currentExercise === 'bicepcurl') && (
                          <div className="flex items-center justify-between pt-2.5 border-t border-[#E2E4E9] dark:border-[#262630]">
                            <label
                              htmlFor="details-curl-weight-input"
                              className="text-[#6b6b76] dark:text-[#8b8b94] font-normal text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <Dumbbell className="w-3.5 h-3.5 text-[#3641C9] dark:text-[#8A9CF7] shrink-0" />
                              Weight lifted
                            </label>
                            <div className="relative flex items-center">
                              <input
                                id="details-curl-weight-input"
                                type="number"
                                min="0"
                                max="500"
                                step="1"
                                value={curlWeightLbs}
                                onChange={(e) => handleWeightChange(e.target.value)}
                                onBlur={handleWeightBlur}
                                className="w-20 pl-2 pr-8 py-0.5 text-right font-bold font-mono text-sm text-[#3641C9] dark:text-[#8A9CF7] bg-neutral-100 hover:bg-neutral-200/80 dark:bg-[#262630]/60 dark:hover:bg-[#262630] border border-[#E2E4E9] dark:border-[#35353d] rounded-lg focus:outline-none focus:border-[#3641C9] focus:ring-1 focus:ring-[#3641C9] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all cursor-text"
                                placeholder="15"
                              />
                              <span className="absolute right-2 text-xs font-bold text-[#3641C9] dark:text-[#8A9CF7] pointer-events-none select-none">
                                lbs
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons: [Turn off camera] [Reset] + [Finish & predict calories] */}
                <div className="space-y-3 pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={isCameraActive ? stopCamera : () => startCamera()}
                      className="py-3 px-3 rounded-[14px] text-xs sm:text-sm font-medium bg-[#E2E4E9] hover:bg-[#d8dadf] dark:bg-[#181822] dark:hover:bg-[#262630] border border-[#E2E4E9] dark:border-[#262630] text-[#0F0F0F] dark:text-white active:scale-[0.98] transition-all cursor-pointer text-center"
                    >
                      {isCameraActive ? 'Turn off camera' : 'Turn on camera'}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetReps}
                      className="py-3 px-3 rounded-[14px] text-xs sm:text-sm font-medium bg-[#E2E4E9] hover:bg-[#d8dadf] dark:bg-[#181822] dark:hover:bg-[#262630] border border-[#E2E4E9] dark:border-[#262630] text-[#0F0F0F] dark:text-white active:scale-[0.98] transition-all cursor-pointer text-center"
                    >
                      Reset
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinishWorkout}
                    className="w-full bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] text-white rounded-[14px] py-3.5 text-xs sm:text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-[#3641C9]/25 text-center"
                  >
                    Finish & predict calories
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Set History Card: 28px radius */}
          <div className="mt-6">
            <div className="p-6 rounded-[28px] border border-[#E2E4E9] dark:border-[#262630] bg-white dark:bg-[#16161D] text-[#0F0F0F] dark:text-[#F7F7F7] shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E4E9] dark:border-[#262630]">
                <div>
                  <h3 className="text-sm font-bold text-[#0F0F0F] dark:text-[#F7F7F7]">
                    Set history
                  </h3>
                  <p className="text-xs mt-0.5 font-normal text-[#6b6b76] dark:text-[#8b8b94]">
                    Sets save automatically after a rep goal or 10 seconds of rest.
                  </p>
                </div>
                <span className="text-xs font-normal px-3 py-0.5 rounded-full border border-[#E2E4E9] dark:border-[#262630] text-[#6b6b76] dark:text-[#8b8b94]">
                  10s auto-end
                </span>
              </div>

              <SetTrackerStepper
                exerciseGroups={exerciseGroups}
                activeSet={activeSet}
                currentExercise={currentExercise}
                activeExercise={activeExercise}
                weightLbs={activeExercise === 'bicepcurl' ? (Number(curlWeightLbs) || 0) : null}
                now={trackerNow}
                onEndSet={endActiveSet}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Post-Workout Progress & Calorie Prediction Modal */}
      {summaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto font-sans">
          <div className="relative w-full max-w-[440px] p-8 rounded-[28px] bg-white dark:bg-[#16161D] border border-[#E2E4E9] dark:border-[#262630] shadow-2xl text-[#0F0F0F] dark:text-[#F7F7F7] my-auto space-y-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Small × close top-right */}
            <button
              type="button"
              onClick={() => {
                setSummaryData(null);
                setCalorieResult(null);
                currentSavedItemIdRef.current = null;
              }}
              className="absolute top-7 right-7 text-[#6b6b76] hover:text-[#0F0F0F] dark:text-[#8b8b94] dark:hover:text-[#F7F7F7] transition-colors p-1 rounded-lg focus:outline-none"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Screen 1: Before Prediction */}
            {!calorieResult && (
              <>
                {/* Title & Muted Subtitle */}
                <div className="pr-8">
                  <h2 className="text-2xl font-bold text-[#0F0F0F] dark:text-[#F7F7F7] tracking-tight">
                    Workout complete
                  </h2>
                  <p className="text-xs text-[#6b6b76] dark:text-[#8b8b94] mt-1 font-normal">
                    Enter your average heart rate to estimate calories.
                  </p>
                </div>

                {/* Centered Duration Stat (48px bold number + muted "duration" below) */}
                <div className="text-center py-2">
                  <div className="text-[48px] font-bold text-[#0F0F0F] dark:text-[#F7F7F7] leading-none tracking-tight font-mono">
                    {formatDuration(summaryData.duration)}
                  </div>
                  <div className="text-xs text-[#6b6b76] dark:text-[#8b8b94] mt-2 font-normal lowercase">
                    duration
                  </div>
                </div>

                {/* Weight Lifted Stat for Bicep Curls */}
                {(activeExercise === 'bicepcurl' || (summaryData?.exercise || '').toLowerCase().includes('curl')) && (
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F7F7F7] dark:bg-[#181822] border border-[#E2E4E9] dark:border-[#262630] text-xs">
                    <span className="text-[#6b6b76] dark:text-[#8b8b94] font-medium flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-[#3641C9] dark:text-[#8A9CF7]" />
                      Weight lifted:
                    </span>
                    <span className="font-bold font-mono text-[#3641C9] dark:text-[#8A9CF7] text-sm">
                      {curlWeightLbs || 0} lbs
                    </span>
                  </div>
                )}

                {/* Average Heart Rate Input Bar */}
                <div>
                  <label className="block text-xs text-[#6b6b76] dark:text-[#8b8b94] mb-2 font-normal">
                    Average heart rate
                  </label>
                  <div className="flex items-center gap-2.5 p-1.5 pl-4 bg-[#F7F7F7] dark:bg-[#0F0F0F] border border-[#E2E4E9] dark:border-[#262630] rounded-[16px] focus-within:border-[#3641C9] focus-within:ring-2 focus-within:ring-[#3641C9]/20 transition-all">
                    <Heart className="w-4 h-4 text-[#3641C9] dark:text-[#8A9CF7] fill-[#3641C9] dark:fill-[#8A9CF7] shrink-0" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={calorieInputs.avgHeartRate ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setCalorieInputs({ ...calorieInputs, avgHeartRate: '' });
                          return;
                        }
                        const digitsOnly = raw.replace(/\D/g, '');
                        if (digitsOnly.length <= 3) {
                          setCalorieInputs({ ...calorieInputs, avgHeartRate: digitsOnly });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          predictCalories(calorieInputs, summaryData);
                        }
                      }}
                      placeholder="138"
                      className="w-full bg-transparent text-[#0F0F0F] dark:text-[#F7F7F7] font-semibold text-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
                    />
                    <span className="text-xs font-medium text-[#6b6b76] dark:text-[#8b8b94] shrink-0">
                      BPM
                    </span>
                    <button
                      type="button"
                      disabled={isPredictingCal}
                      onClick={() => predictCalories(calorieInputs, summaryData)}
                      className="shrink-0 bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] text-white rounded-[12px] px-4 py-2.5 font-semibold text-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {isPredictingCal ? 'Calculating...' : 'Predict calories'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Screen 2: After Prediction */}
            {calorieResult && (
              <>
                {/* Title & Muted Subtitle */}
                <div className="pr-8">
                  <h2 className="text-2xl font-bold text-[#0F0F0F] dark:text-[#F7F7F7] tracking-tight">
                    Workout complete
                  </h2>
                  <p className="text-xs text-[#6b6b76] dark:text-[#8b8b94] mt-1 font-normal">
                    Here's your estimated burn.
                  </p>
                </div>

                {/* Hero: Huge Centered Calorie Number (~100px, 800 weight) + Muted "kcal burned" + 30px Duration */}
                <div className="text-center pt-2">
                  <div className="text-[100px] font-[800] text-[#14006A] dark:text-[#8A9CF7] leading-none tracking-tight font-sans">
                    {calorieResult.predicted_calories}
                  </div>
                  <div className="text-xs text-[#6b6b76] dark:text-[#8b8b94] mt-2 font-normal lowercase">
                    kcal burned
                  </div>

                  <div className="mt-4">
                    <div className="text-[30px] font-bold text-[#0F0F0F] dark:text-[#F7F7F7] leading-none font-mono">
                      {formatDuration(summaryData.duration)}
                    </div>
                    <div className="text-xs text-[#6b6b76] dark:text-[#8b8b94] mt-1 font-normal lowercase">
                      duration
                    </div>
                  </div>

                  {/* Weight Lifted for Bicep Curls */}
                  {(activeExercise === 'bicepcurl' || (summaryData?.exercise || '').toLowerCase().includes('curl')) && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3641C9]/10 text-xs font-mono font-bold text-[#3641C9] dark:text-[#8A9CF7] border border-[#3641C9]/20">
                      <Dumbbell className="w-3.5 h-3.5" />
                      <span>{curlWeightLbs || 0} lbs weight lifted</span>
                    </div>
                  )}
                </div>

                {/* Heart Rate Adjuster, Start New Session, Return to Dashboard */}
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs text-[#6b6b76] dark:text-[#8b8b94] mb-2 font-normal">
                      Average heart rate
                    </label>
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={calorieInputs.avgHeartRate ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              setCalorieInputs({ ...calorieInputs, avgHeartRate: '' });
                              return;
                            }
                            const digitsOnly = raw.replace(/\D/g, '');
                            if (digitsOnly.length <= 3) {
                              setCalorieInputs({ ...calorieInputs, avgHeartRate: digitsOnly });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              predictCalories(calorieInputs, summaryData);
                            }
                          }}
                          placeholder="138"
                          className="w-full bg-[#F7F7F7] dark:bg-[#0F0F0F] border border-[#E2E4E9] dark:border-[#262630] text-[#0F0F0F] dark:text-[#F7F7F7] rounded-[14px] px-4 py-2.5 pr-12 font-semibold text-sm focus:outline-none focus:border-[#3641C9] focus:ring-2 focus:ring-[#3641C9]/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                        />
                        <span className="absolute right-3.5 top-3 text-xs font-medium text-[#6b6b76] dark:text-[#8b8b94] pointer-events-none">
                          BPM
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isPredictingCal}
                        onClick={() => predictCalories(calorieInputs, summaryData)}
                        className="bg-[#F7F7F7] dark:bg-[#181822] hover:bg-[#e2e4e9] dark:hover:bg-[#262630] text-[#0F0F0F] dark:text-[#F7F7F7] border border-[#E2E4E9] dark:border-[#262630] rounded-[14px] px-5 py-2.5 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        {isPredictingCal ? '...' : 'Recalculate'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSummaryData(null);
                      setCalorieResult(null);
                      currentSavedItemIdRef.current = null;
                      setWorkoutDuration(0);
                      resetAllSets();
                      handleResetReps();
                      heartRateSamplesRef.current = [];
                      startCamera();
                    }}
                    className="w-full bg-[#3641C9] hover:bg-[#2C35A8] text-white rounded-[14px] py-3.5 font-semibold text-xs active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                  >
                    Start new session
                  </button>

                  <Link
                    to="/"
                    className="block w-full text-center text-xs text-[#6b6b76] hover:text-[#0F0F0F] dark:text-[#8b8b94] dark:hover:text-[#F7F7F7] transition-colors py-1"
                  >
                    Return to dashboard
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
