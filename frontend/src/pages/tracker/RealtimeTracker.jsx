import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '../../components/PageWrapper';
import { useTheme } from '../../hooks/useTheme';
import { BiomechanicsEngine, EXERCISE_INFO } from '../../lib/mediapipeTracker';
import { drawPoseSkeleton, drawWorkoutHUD } from '../../lib/skeletonRenderer';

const EXERCISES = [
  { id: 'auto', name: 'Auto-Detect' },
  { id: 'squat', name: 'Squats' },
  { id: 'pushup', name: 'Push-Ups' },
  { id: 'plank', name: 'Plank' },
  { id: 'jumpingjack', name: 'Jumping Jacks' },
  { id: 'bicepcurl', name: 'Bicep Curls' },
];

export const RealtimeTracker = () => {
  const { darkMode } = useTheme();

  // State
  const [activeExercise, setActiveExercise] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const exParam = params.get('exercise');
      if (exParam && EXERCISES.some((e) => e.id === exParam.toLowerCase())) {
        return exParam.toLowerCase();
      }
    }
    return 'auto';
  });
  const [videoSource, setVideoSource] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('source') === 'demo') return 'demo';
    }
    return 'camera';
  });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showJoints, setShowJoints] = useState(true);
  const [showAngles, setShowAngles] = useState(true);
  const [isMirrored, setIsMirrored] = useState(true);
  const [fps, setFps] = useState(0);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [summaryData, setSummaryData] = useState(null);

  // Time tracking
  const [sessionStartTimeFormatted, setSessionStartTimeFormatted] = useState('');

  // Per-exercise sets tracking (for manual modes: Squats, Push-Ups, Plank, Jumping Jacks, Bicep Curls)
  const [exerciseSets, setExerciseSets] = useState({
    squat: [],
    pushup: [],
    plank: [],
    jumpingjack: [],
    bicepcurl: [],
  });

  // Live Telemetry
  const [telemetry, setTelemetry] = useState({
    bodyVisible: false,
    isAuto: true,
    autoState: 'waiting',
    isLocked: false,
    holdProgress: 0,
    exercise: 'squat',
    detectedInfo: EXERCISE_INFO.squat,
    confidence: 100,
    exerciseStartedFormatted: '',
    exerciseActiveDurationSecs: 0,
    reps: 0,
    phase: 'ready',
    formScore: 100,
    formErrors: [],
    feedback: 'Step into camera frame to begin workout detection',
    angles: {},
    holdSeconds: 0,
    sessionTotals: { squat: 0, pushup: 0, plank: 0, jumpingjack: 0, bicepcurl: 0 },
  });

  // Active sets for currently selected manual exercise
  const currentSets = activeExercise !== 'auto' ? (exerciseSets[activeExercise] || []) : [];
  const currentSetNumber = activeExercise !== 'auto' ? currentSets.length + 1 : null;

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
  const lastTelemetryTimeRef = useRef(0);
  const prevTelemetryStateRef = useRef({ reps: -1, phase: '', autoState: '', isLocked: false, holdProgress: -1 });

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
    if (isCameraActive && !isPaused && !summaryData) {
      timer = setInterval(() => {
        setWorkoutDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCameraActive, isPaused, summaryData]);

  // Connect optional backend WebSocket for recording/logging
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = 'sess_' + Math.random().toString(36).substring(2, 9);
    }
    const wsUrl = `ws://localhost:8000/ws/workout/${sessionIdRef.current}`;
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
      throw new Error('MediaPipe Pose library is loading. Please try again.');
    }

    const pose = new PoseConstructor({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
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
      await initMediaPipe();

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
          videoRef.current.playsInline = true;
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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setVideoSource('camera');
        setIsCameraActive(true);
      }

      const nowFormatted = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setSessionStartTimeFormatted(nowFormatted);
    } catch (err) {
      console.error('Camera initialization error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err.message || 'Unable to access webcam.'
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
    setIsCameraActive(false);
  }, []);

  // Frame Processing & Render Loop
  useEffect(() => {
    if (!isCameraActive || isPaused) return;

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

              // Performance Optimization: Throttle React re-renders to ~10-15 Hz
              // or immediately on key state changes (reps, phase, locked, autoState)
              // This keeps 60 FPS canvas rendering completely decoupled from React DOM overhead!
              const nowMs = performance.now();
              const prevState = prevTelemetryStateRef.current;
              const hasKeyChange =
                result.reps !== prevState.reps ||
                result.phase !== prevState.phase ||
                result.autoState !== prevState.autoState ||
                result.isLocked !== prevState.isLocked ||
                Math.abs((result.holdProgress || 0) - prevState.holdProgress) > 0.08 ||
                result.formScore !== prevState.formScore ||
                nowMs - lastTelemetryTimeRef.current >= 80;

              if (hasKeyChange) {
                lastTelemetryTimeRef.current = nowMs;
                prevTelemetryStateRef.current = {
                  reps: result.reps,
                  phase: result.phase,
                  autoState: result.autoState,
                  isLocked: result.isLocked,
                  holdProgress: result.holdProgress || 0,
                  formScore: result.formScore,
                };
                setTelemetry(result);
              }

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
                reps: result.reps,
                phase: result.phase,
                formScore: result.formScore,
                feedback: result.feedback,
                bodyVisible: result.bodyVisible,
                activeExercise: result.exercise,
                holdSeconds: result.holdSeconds,
                isAuto: result.isAuto,
                detectedInfo: result.detectedInfo,
                confidence: result.confidence,
                exerciseStartedFormatted: result.exerciseStartedFormatted,
                startTimeFormatted: sessionStartTimeFormatted,
                autoState: result.autoState,
                isLocked: result.isLocked,
                holdProgress: result.holdProgress,
                setNumber: currentSetNumber,
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
  }, [isCameraActive, isPaused, activeExercise, showJoints, showAngles, isMirrored, videoSource, sessionStartTimeFormatted, currentSetNumber]);

  useEffect(() => {
    const launchTimer = setTimeout(() => {
      startCamera();
    }, 100);

    return () => {
      clearTimeout(launchTimer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Commit current set reps/duration for manual exercise mode
  const commitCurrentSet = useCallback((exerciseId = activeExercise) => {
    if (exerciseId === 'auto') return;

    const isPlank = exerciseId === 'plank';
    const count = isPlank ? Math.floor(telemetry.holdSeconds) : telemetry.reps;

    if (count > 0) {
      setExerciseSets((prev) => {
        const currentList = prev[exerciseId] || [];
        const newSet = {
          setNumber: currentList.length + 1,
          reps: count,
          isPlank,
          formScore: telemetry.formScore,
          completedAt: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        };
        return {
          ...prev,
          [exerciseId]: [...currentList, newSet],
        };
      });
    }

    if (engineRef.current) {
      engineRef.current.resetSet();
    }
    setTelemetry((prev) => ({
      ...prev,
      reps: 0,
      holdSeconds: 0,
      phase: 'ready',
      formScore: 100,
      feedback: 'Ready for next set',
    }));
  }, [activeExercise, telemetry.holdSeconds, telemetry.reps, telemetry.formScore]);

  // Changing exercise: automatically logs in-progress set for manual mode and switches
  const handleSelectExercise = useCallback((nextId) => {
    if (nextId === 'auto' && activeExercise === 'auto') {
      if (engineRef.current) {
        engineRef.current.unlock();
      }
      setTelemetry((prev) => ({
        ...prev,
        isLocked: false,
        autoState: 'hold_steady',
        holdProgress: 0,
        feedback: 'Hold steady to detect new exercise',
      }));
      return;
    }

    if (nextId === activeExercise) return;

    // Automatically commit in-progress set when leaving manual exercise
    if (activeExercise !== 'auto') {
      const isPlank = activeExercise === 'plank';
      const count = isPlank ? Math.floor(telemetry.holdSeconds) : telemetry.reps;
      if (count > 0) {
        setExerciseSets((prev) => {
          const currentList = prev[activeExercise] || [];
          const newSet = {
            setNumber: currentList.length + 1,
            reps: count,
            isPlank,
            formScore: telemetry.formScore,
            completedAt: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          };
          return {
            ...prev,
            [activeExercise]: [...currentList, newSet],
          };
        });
      }
    }

    setActiveExercise(nextId);

    if (engineRef.current) {
      engineRef.current.setExercise(nextId);
    }
    setTelemetry((prev) => ({
      ...prev,
      reps: 0,
      holdSeconds: 0,
      phase: 'ready',
      feedback:
        nextId === 'auto'
          ? 'Step into camera frame to begin workout detection'
          : `Ready to start ${EXERCISE_INFO[nextId]?.name || nextId}`,
    }));
  }, [activeExercise, telemetry.holdSeconds, telemetry.reps, telemetry.formScore]);

  // Manually trigger set completion
  const handleCompleteSet = () => {
    commitCurrentSet(activeExercise);
  };

  // Reset active set reps
  const handleResetReps = () => {
    if (engineRef.current) {
      engineRef.current.resetSet();
    }
    setTelemetry((prev) => ({
      ...prev,
      reps: 0,
      holdSeconds: 0,
      phase: 'ready',
      formScore: 100,
      formErrors: [],
    }));
  };

  // Clear completed sets for specific exercise
  const handleClearExerciseSets = (exerciseId = activeExercise) => {
    if (exerciseId === 'auto') return;
    setExerciseSets((prev) => ({
      ...prev,
      [exerciseId]: [],
    }));
    handleResetReps();
  };

  const handleFinishWorkout = () => {
    stopCamera();

    let finalSets = { ...exerciseSets };
    if (activeExercise !== 'auto') {
      const isPlank = activeExercise === 'plank';
      const count = isPlank ? Math.floor(telemetry.holdSeconds) : telemetry.reps;
      if (count > 0) {
        const currentList = finalSets[activeExercise] || [];
        const newSet = {
          setNumber: currentList.length + 1,
          reps: count,
          isPlank,
          formScore: telemetry.formScore,
          completedAt: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        };
        finalSets = {
          ...finalSets,
          [activeExercise]: [...currentList, newSet],
        };
        setExerciseSets(finalSets);
      }
    }

    const cals = Math.round((workoutDuration / 60) * 7.5);
    setSummaryData({
      exercise: telemetry.detectedInfo?.name || activeExercise,
      reps: telemetry.reps,
      duration: workoutDuration,
      avgFormScore: telemetry.formScore,
      calories: cals,
      errors: telemetry.formErrors,
      sessionStarted: sessionStartTimeFormatted,
      sessionCompleted: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      sessionTotals: telemetry.sessionTotals,
      exerciseSets: finalSets,
    });
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <PageWrapper hideFooter={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* Clean, Simple Top Header with Workout Selectors (No Icons) */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Workout Tracker
            </h1>
            {sessionStartTimeFormatted && (
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Started at {sessionStartTimeFormatted}
              </p>
            )}
          </div>

          {/* Exercise Selector Pills - Clean Text with Set Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {EXERCISES.map((ex) => {
              const isSelected = activeExercise === ex.id;
              const setBadgeCount = ex.id !== 'auto' ? (exerciseSets[ex.id]?.length || 0) : 0;
              return (
                <button
                  key={ex.id}
                  onClick={() => handleSelectExercise(ex.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-sm'
                      : darkMode
                      ? 'bg-white/5 text-neutral-400 hover:text-white border border-white/10 hover:bg-white/10'
                      : 'bg-neutral-100 text-neutral-600 hover:text-black border border-neutral-200 hover:bg-neutral-200/60'
                  }`}
                >
                  <span>{ex.name}</span>
                  {setBadgeCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected
                          ? 'bg-black/25 text-white'
                          : 'bg-orange-500/10 text-orange-500 font-bold'
                      }`}
                    >
                      {setBadgeCount} {setBadgeCount === 1 ? 'set' : 'sets'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Camera Permission Alert (if blocked) */}
        {cameraError && (
          <div className="mb-4 p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-center max-w-lg mx-auto">
            <h3 className="text-sm font-bold text-red-500 mb-1">Camera Access Required</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-3">{cameraError}</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => startCamera('camera')}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-all"
              >
                Retry Camera
              </button>
              <button
                onClick={() => startCamera('demo')}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 shadow-sm transition-all"
              >
                Try Demo Athlete Video
              </button>
            </div>
          </div>
        )}

        {/* Larger Camera View Layout (lg:col-span-9) paired with Unified Clean Sidebar (lg:col-span-3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Main Video View - Enlarged 9 Columns */}
          <div className="lg:col-span-9 flex flex-col">
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black/90 border border-neutral-200/40 dark:border-white/10 shadow-lg">
              {/* Webcam or Demo Athlete Video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-transform duration-200 ${
                  videoSource === 'demo' ? '' : isMirrored ? '-scale-x-100' : ''
                }`}
              />

              {/* MediaPipe Visible Joints & Skeleton Canvas Overlay */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Minimal Top Badges on Video */}
              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-auto">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] border border-white/10 text-neutral-300 font-mono">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <span>{fps} FPS</span>
                </div>

                <div className="px-3 py-1 rounded-full bg-orange-600 text-white text-xs font-semibold uppercase tracking-wider">
                  {activeExercise === 'auto'
                    ? telemetry.isLocked
                      ? `AUTO: ${telemetry.detectedInfo?.shortName?.toUpperCase() || 'EXERCISE'} (LOCKED)`
                      : telemetry.autoState === 'hold_steady'
                      ? `AUTO: HOLD STEADY (${Math.round((telemetry.holdProgress || 0) * 100)}%)`
                      : telemetry.autoState === 'detecting'
                      ? 'AUTO: DETECTING...'
                      : 'AUTO: WAITING FOR POSE'
                    : `${telemetry.detectedInfo?.shortName?.toUpperCase() || activeExercise.toUpperCase()} • SET ${currentSets.length + 1}`}
                </div>

                {isPaused && (
                  <span className="px-2.5 py-1 rounded-full bg-yellow-500 text-black text-xs font-bold uppercase tracking-wider">
                    PAUSED
                  </span>
                )}
              </div>

              {/* Minimal Top-Right Controls on Video */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-auto">
                <button
                  onClick={() => {
                    const next = videoSource === 'camera' ? 'demo' : 'camera';
                    startCamera(next);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
                    videoSource === 'demo'
                      ? 'bg-orange-600 border-orange-500 text-white shadow-sm'
                      : 'bg-black/60 border-white/10 text-neutral-300 hover:text-white'
                  }`}
                  title="Switch between live camera and demo athlete video"
                >
                  {videoSource === 'demo' ? 'Demo User: Active' : 'Demo User'}
                </button>
                <button
                  onClick={() => setShowJoints(!showJoints)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
                    showJoints
                      ? 'bg-orange-600/90 border-orange-500 text-white'
                      : 'bg-black/60 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  Joints: {showJoints ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => setShowAngles(!showAngles)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
                    showAngles
                      ? 'bg-orange-600/90 border-orange-500 text-white'
                      : 'bg-black/60 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  Angles
                </button>
                <button
                  onClick={() => setIsMirrored(!isMirrored)}
                  className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-xs text-neutral-300 hover:text-white transition-all"
                >
                  Mirror
                </button>
              </div>

              {/* Start Camera Prompt (If not started yet) */}
              {!isCameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
                  <h3 className="text-lg font-bold text-white mb-2">Camera Ready</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mb-4">
                    Real-time pose and joint tracking will begin immediately.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-2.5 rounded-full text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-md transition-all"
                  >
                    Start Camera
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Simple, Unified Right Stats & Controls Sidebar (3 Columns) */}
          <div className="lg:col-span-3 flex flex-col">
            <div
              className={`p-6 rounded-2xl border flex-1 flex flex-col justify-between ${
                darkMode ? 'bg-[#15151e] border-white/5' : 'bg-white border-neutral-200/80 shadow-sm'
              }`}
            >
              <div className="space-y-6">
                {/* Reps / Hold Time */}
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                    <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span>{telemetry.exercise === 'plank' ? 'Hold Time' : 'Completed Reps'}</span>
                      {activeExercise !== 'auto' && (
                        <span className="px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-500 font-mono font-bold text-[10px]">
                          SET {currentSets.length + 1}
                        </span>
                      )}
                    </span>
                    <span className="font-bold uppercase text-[10px] text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                      {telemetry.phase}
                    </span>
                  </div>
                  <div className="text-6xl font-extrabold text-orange-600 tracking-tight">
                    {telemetry.exercise === 'plank' ? `${Math.floor(telemetry.holdSeconds)}s` : telemetry.reps}
                  </div>
                </div>

                {/* Form Precision Score */}
                <div className="pt-4 border-t border-neutral-100 dark:border-white/5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                      Form Precision
                    </span>
                    <span
                      className={`font-bold ${
                        telemetry.formScore >= 80 ? 'text-green-500' : 'text-orange-500'
                      }`}
                    >
                      {telemetry.formScore}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${telemetry.formScore}%`,
                        backgroundColor: telemetry.formScore >= 80 ? '#22c55e' : '#ea580c',
                      }}
                    />
                  </div>
                </div>

                {/* Sets History Log for Manual Exercise */}
                {activeExercise !== 'auto' && (
                  <div className="pt-4 border-t border-neutral-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                          Sets Log
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold font-mono">
                          {currentSets.length} {currentSets.length === 1 ? 'set' : 'sets'}
                        </span>
                      </div>
                      {currentSets.length > 0 && (
                        <button
                          onClick={() => handleClearExerciseSets(activeExercise)}
                          className="text-[10px] text-neutral-400 hover:text-red-500 transition-colors"
                          title="Clear completed sets for this exercise"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {currentSets.length === 0 ? (
                      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-dashed border-neutral-200 dark:border-white/10 text-center">
                        <p className="text-[11px] text-neutral-400">
                          Active: <span className="font-semibold text-orange-500">Set 1</span>. Reps will log as a set when completed or when switching exercise.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {currentSets.map((s) => (
                          <div
                            key={s.setNumber}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-100/70 dark:bg-white/5 border border-neutral-200/50 dark:border-white/5 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-orange-500/10 text-orange-500 font-mono font-bold text-[10px] flex items-center justify-center">
                                {s.setNumber}
                              </span>
                              <span className="font-medium text-neutral-700 dark:text-neutral-200">
                                Set {s.setNumber}:
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                                {s.isPlank ? `${s.reps}s` : `${s.reps} reps`}
                              </span>
                              {s.formScore !== undefined && (
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  ({s.formScore}%)
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Exercise & Time Summary */}
                <div className="pt-4 border-t border-neutral-100 dark:border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">
                      {activeExercise === 'auto' ? 'Auto-Detected:' : 'Exercise:'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                        {activeExercise === 'auto'
                          ? telemetry.isLocked
                            ? `${telemetry.detectedInfo?.name || 'Detected'} (Locked)`
                            : telemetry.autoState === 'detecting'
                            ? 'Detecting...'
                            : telemetry.autoState === 'hold_steady'
                            ? 'Hold Steady'
                            : 'Waiting for Pose'
                          : telemetry.detectedInfo?.name || activeExercise}
                      </span>
                      {activeExercise === 'auto' && telemetry.isLocked && (
                        <button
                          onClick={() => {
                            if (engineRef.current) engineRef.current.unlock();
                            setTelemetry((prev) => ({
                              ...prev,
                              isLocked: false,
                              autoState: 'hold_steady',
                              holdProgress: 0,
                              feedback: 'Hold steady to detect new exercise',
                            }));
                          }}
                          className="text-[10px] font-semibold text-orange-500 hover:text-orange-400 px-1.5 py-0.5 rounded bg-orange-500/10 transition-colors"
                          title="Unlock exercise to detect a different one"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>
                  {activeExercise === 'auto' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Status:</span>
                        <span className="font-semibold text-orange-500">
                          {telemetry.autoState === 'waiting'
                            ? 'Waiting'
                            : telemetry.autoState === 'hold_steady'
                            ? 'Hold steady'
                            : telemetry.autoState === 'detecting'
                            ? 'Detecting'
                            : 'Counting'}
                        </span>
                      </div>
                      {telemetry.autoState === 'hold_steady' && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-neutral-400">Hold Progress:</span>
                            <span className="font-mono font-bold text-orange-500">
                              {Math.round((telemetry.holdProgress || 0) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-orange-500 transition-all duration-150"
                              style={{
                                width: `${Math.round((telemetry.holdProgress || 0) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {sessionStartTimeFormatted && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Started:</span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300 font-medium">
                        {sessionStartTimeFormatted}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Duration:</span>
                    <span className="font-mono font-bold text-orange-600">
                      {formatDuration(workoutDuration)}
                    </span>
                  </div>

                  {/* Session Exercise Totals (for Auto-Detect) */}
                  {telemetry.sessionTotals &&
                    Object.values(telemetry.sessionTotals).some((v) => v > 0) && (
                      <div className="pt-2 border-t border-neutral-100 dark:border-white/5">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                          Session Totals
                        </span>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          {Object.entries(telemetry.sessionTotals).map(([key, val]) => {
                            if (val === 0 && telemetry.exercise !== key) return null;
                            const info = EXERCISE_INFO[key];
                            return (
                              <div
                                key={key}
                                className="flex justify-between px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/5"
                              >
                                <span className="text-neutral-500 dark:text-neutral-400">
                                  {info?.shortName || key}:
                                </span>
                                <span className="font-mono font-bold text-orange-500">
                                  {key === 'plank' ? `${val}s` : val}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Minimal Clean Action Buttons */}
              <div className="pt-6 border-t border-neutral-100 dark:border-white/5 space-y-2 mt-6">
                {activeExercise === 'auto' && telemetry.isLocked && (
                  <button
                    onClick={() => {
                      if (engineRef.current) engineRef.current.unlock();
                      setTelemetry((prev) => ({
                        ...prev,
                        isLocked: false,
                        autoState: 'hold_steady',
                        holdProgress: 0,
                        feedback: 'Hold steady to detect new exercise',
                      }));
                    }}
                    className="w-full py-2.5 rounded-full text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Unlock and re-detect exercise"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Switch Exercise (Re-Detect)</span>
                  </button>
                )}

                {activeExercise !== 'auto' && (
                  <button
                    onClick={handleCompleteSet}
                    disabled={activeExercise === 'plank' ? telemetry.holdSeconds < 1 : telemetry.reps < 1}
                    className={`w-full py-2.5 rounded-full text-xs font-semibold shadow-sm transition-all ${
                      (activeExercise === 'plank' ? telemetry.holdSeconds >= 1 : telemetry.reps >= 1)
                        ? 'bg-orange-600 hover:bg-orange-500 text-white cursor-pointer'
                        : 'bg-neutral-200 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    Complete Set {currentSets.length + 1}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`py-2.5 rounded-full text-xs font-semibold border transition-all ${
                      darkMode
                        ? 'border-white/10 text-neutral-200 hover:bg-white/5'
                        : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={handleResetReps}
                    className={`py-2.5 rounded-full text-xs font-semibold border transition-all ${
                      darkMode
                        ? 'border-white/10 text-neutral-200 hover:bg-white/5'
                        : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                    title="Reset active set reps"
                  >
                    Reset Set
                  </button>
                </div>

                <button
                  onClick={handleFinishWorkout}
                  className="w-full py-3 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-sm transition-all"
                >
                  Finish Workout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Performance Summary Modal with Sets Breakdown */}
        {summaryData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div
              className={`w-full max-w-md p-8 rounded-2xl border text-center shadow-xl ${
                darkMode ? 'bg-[#15151e] border-white/10' : 'bg-white border-neutral-200'
              }`}
            >
              <h2 className="text-2xl font-bold mb-1">Workout Complete</h2>
              <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-6">
                {summaryData.exercise} Summary
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-4 rounded-xl bg-neutral-100 dark:bg-white/5">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                    {telemetry.exercise === 'plank' ? 'Hold Time' : 'Reps Completed'}
                  </span>
                  <span className="text-3xl font-extrabold text-orange-600">
                    {telemetry.exercise === 'plank' ? `${summaryData.reps}s` : summaryData.reps}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-100 dark:bg-white/5">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                    Form Score
                  </span>
                  <span className="text-3xl font-extrabold text-orange-600">
                    {summaryData.avgFormScore}%
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-100 dark:bg-white/5">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                    Duration
                  </span>
                  <span className="text-lg font-bold font-mono">
                    {formatDuration(summaryData.duration)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-100 dark:bg-white/5">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                    Est. Calories
                  </span>
                  <span className="text-lg font-bold font-mono">
                    {summaryData.calories} kcal
                  </span>
                </div>
              </div>

              {/* Sets & Reps Breakdown for Manual Exercises */}
              {summaryData.exerciseSets &&
                Object.entries(summaryData.exerciseSets).some(([, sets]) => sets.length > 0) && (
                  <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-white/5 mb-4 text-xs text-left max-h-56 overflow-y-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2.5">
                      Sets & Reps Breakdown
                    </span>
                    <div className="space-y-3">
                      {Object.entries(summaryData.exerciseSets).map(([exId, sets]) => {
                        if (sets.length === 0) return null;
                        const info = EXERCISE_INFO[exId];
                        const totalCount = sets.reduce((acc, s) => acc + s.reps, 0);
                        const isPlank = exId === 'plank';
                        return (
                          <div
                            key={exId}
                            className="p-2.5 rounded-lg bg-black/5 dark:bg-black/30 border border-neutral-200/40 dark:border-white/5"
                          >
                            <div className="flex items-center justify-between font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                              <span>{info?.name || exId}</span>
                              <span className="text-[11px] text-orange-500 font-mono">
                                Total: {isPlank ? `${totalCount}s` : `${totalCount} reps`} ({sets.length} {sets.length === 1 ? 'set' : 'sets'})
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                              {sets.map((s) => (
                                <div
                                  key={s.setNumber}
                                  className="flex items-center justify-between px-2 py-1 rounded bg-white/60 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 font-mono"
                                >
                                  <span>Set {s.setNumber}:</span>
                                  <span className="font-bold text-orange-600 dark:text-orange-400">
                                    {s.isPlank ? `${s.reps}s` : `${s.reps} reps`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Per-Exercise Breakdown if Auto-detect session totals recorded */}
              {summaryData.sessionTotals &&
                Object.values(summaryData.sessionTotals).some((v) => v > 0) && (
                  <div className="p-3 rounded-xl bg-neutral-100 dark:bg-white/5 mb-4 text-xs">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-2">
                      Session Auto-Detect Totals
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {Object.entries(summaryData.sessionTotals).map(([key, val]) => {
                        if (val === 0) return null;
                        const info = EXERCISE_INFO[key];
                        return (
                          <div
                            key={key}
                            className="flex justify-between px-2 py-1 rounded bg-black/10 dark:bg-black/30"
                          >
                            <span className="text-neutral-400">{info?.name || key}:</span>
                            <span className="font-mono font-bold text-orange-500">
                              {key === 'plank' ? `${val}s` : `${val} reps`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Start and End Timestamps */}
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-white/5 mb-6 text-xs flex items-center justify-around text-neutral-400">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">
                    Started
                  </span>
                  <span className="font-mono font-bold text-neutral-700 dark:text-neutral-200">
                    {summaryData.sessionStarted}
                  </span>
                </div>
                <div className="h-5 w-px bg-neutral-300 dark:bg-white/10" />
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">
                    Finished
                  </span>
                  <span className="font-mono font-bold text-neutral-700 dark:text-neutral-200">
                    {summaryData.sessionCompleted}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    setSummaryData(null);
                    setWorkoutDuration(0);
                    setExerciseSets({
                      squat: [],
                      pushup: [],
                      plank: [],
                      jumpingjack: [],
                      bicepcurl: [],
                    });
                    if (engineRef.current) {
                      engineRef.current.resetSessionTotals();
                    }
                    handleResetReps();
                    startCamera();
                  }}
                  className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-all"
                >
                  New Session
                </button>
                <Link
                  to="/"
                  className="flex-1 py-2.5 rounded-full text-xs font-semibold border border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 transition-all text-center"
                >
                  Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
