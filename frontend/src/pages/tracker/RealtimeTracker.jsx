import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '../../components/PageWrapper';
import { useTheme } from '../../hooks/useTheme';
import { BiomechanicsEngine, EXERCISE_INFO } from '../../lib/mediapipeTracker';
import { drawPoseSkeleton, drawWorkoutHUD } from '../../lib/skeletonRenderer';
import SetTrackerStepper from '../../components/tracker/SetTrackerStepper';
import { useSetTracker } from '../../hooks/useSetTracker';

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
  const [activeExercise, setActiveExercise] = useState('auto');
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

  // Live Telemetry
  const [telemetry, setTelemetry] = useState({
    bodyVisible: false,
    isAuto: true,
    exercise: 'squat',
    detectedInfo: EXERCISE_INFO.squat,
    confidence: 96,
    exerciseStartedFormatted: '',
    exerciseActiveDurationSecs: 0,
    reps: 0,
    phase: 'ready',
    formScore: 100,
    formErrors: [],
    feedback: 'Step into camera frame to begin workout detection',
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
  }, [isCameraActive, isPaused, activeExercise, showJoints, showAngles, isMirrored, videoSource, sessionStartTimeFormatted]);

  useEffect(() => {
    const launchTimer = setTimeout(() => {
      startCamera();
    }, 100);

    return () => {
      clearTimeout(launchTimer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleResetReps = () => {
    if (engineRef.current) {
      engineRef.current.reset();
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

  const currentExercise = activeExercise !== 'auto' ? activeExercise : telemetry.exercise;
  const currentRepCount = currentExercise === 'plank' ? Math.floor(telemetry.holdSeconds) : telemetry.reps;

  const {
    exerciseGroups,
    activeSet,
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
    isPaused,
  });

  const handleFinishWorkout = useCallback(() => {
    stopCamera();
    const cals = Math.round((workoutDuration / 60) * 7.5);
    setSummaryData({
      exercise: telemetry.detectedInfo?.name || activeExercise,
      reps: telemetry.reps,
      duration: workoutDuration,
      avgFormScore: telemetry.formScore,
      calories: cals,
      errors: telemetry.formErrors,
      sessionStarted: sessionStartTimeFormatted,
      sessionCompleted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sets: exerciseGroups,
    });
  }, [stopCamera, workoutDuration, telemetry, activeExercise, sessionStartTimeFormatted, exerciseGroups]);

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
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black dark:text-white">
              Workout Tracker
            </h1>
            {sessionStartTimeFormatted && (
              <p className="text-xs text-neutral-800 dark:text-neutral-400 font-mono font-medium mt-0.5">
                Started at {sessionStartTimeFormatted}
              </p>
            )}
          </div>

          {/* Exercise Selector Pills - Clean Text Without Icons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {EXERCISES.map((ex) => {
              const isSelected = activeExercise === ex.id;
              return (
                <button
                  key={ex.id}
                  onClick={() => setActiveExercise(ex.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-sm'
                      : darkMode
                      ? 'bg-white/5 text-neutral-300 hover:text-white border border-white/10 hover:bg-white/10'
                      : 'bg-neutral-100 text-black hover:text-orange-600 border border-neutral-300 hover:border-black hover:bg-neutral-200/60'
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
          <div className="mb-4 p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-center max-w-lg mx-auto">
            <h3 className="text-sm font-bold text-red-500 mb-1">Camera Access Required</h3>
            <p className="text-xs text-black dark:text-neutral-400 font-medium leading-relaxed mb-3">{cameraError}</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => startCamera('camera')}
                className="px-5 py-2 rounded-full text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-all cursor-pointer"
              >
                Retry Camera
              </button>
              <button
                onClick={() => startCamera('demo')}
                className="px-5 py-2 rounded-full text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 shadow-sm transition-all cursor-pointer"
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
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black/90 border border-neutral-300 dark:border-white/10 shadow-lg">
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

              {/* Minimal Top Badges on Video (Clean & Uncluttered) */}
              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-auto">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] border border-white/10 text-neutral-300 font-mono">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <span>{fps} FPS</span>
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
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border transition-all ${
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
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border transition-all ${
                    showJoints
                      ? 'bg-orange-600/90 border-orange-500 text-white'
                      : 'bg-black/60 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  Joints: {showJoints ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => setShowAngles(!showAngles)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border transition-all ${
                    showAngles
                      ? 'bg-orange-600/90 border-orange-500 text-white'
                      : 'bg-black/60 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  Angles
                </button>
                <button
                  onClick={() => setIsMirrored(!isMirrored)}
                  className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-all"
                >
                  Mirror
                </button>
              </div>

              {/* Start Camera Prompt (If not started yet) */}
              {!isCameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
                  <h3 className="text-lg font-bold text-white mb-2">Camera Ready</h3>
                  <p className="text-xs text-neutral-300 max-w-sm mb-4">
                    Real-time pose and joint tracking will begin immediately.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-2.5 rounded-full text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md transition-all cursor-pointer"
                  >
                    Start Camera
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Simple, Unified Right Stats & Controls Sidebar (3 Columns) */}
          <div className="lg:col-span-3 flex flex-col">
            <div className={`p-6 rounded-2xl border flex-1 flex flex-col justify-between ${
              darkMode ? 'bg-[#15151e] border-white/5' : 'bg-white border-neutral-300 shadow-sm'
            }`}>
              <div className="space-y-6">
                {/* Current Set & Rep Counter */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-black uppercase tracking-wider text-xs text-black dark:text-white flex items-center gap-1.5">
                      <span>Set {currentSetNumber}</span>
                      {activeSet && (
                        <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
                      )}
                    </span>
                    <span className={`font-black uppercase text-[10px] px-2.5 py-0.5 rounded-full ${
                      activeSet
                        ? 'text-orange-600 bg-orange-500/10'
                        : isResting
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                        : 'text-black dark:text-neutral-300 bg-neutral-200/70 dark:bg-white/5'
                    }`}>
                      {activeSet ? (telemetry.phase || 'ACTIVE') : isResting ? 'RESTING' : 'READY'}
                    </span>
                  </div>

                  <div className="text-6xl font-black text-orange-600 tracking-tight">
                    {currentExercise === 'plank' ? `${Math.floor(displayReps)}s` : displayReps}
                  </div>

                  <div className="text-xs text-black dark:text-neutral-300 font-mono font-bold mt-1 flex items-center justify-between">
                    <span>{currentExercise === 'plank' ? 'Hold Time' : 'Completed Reps'}</span>
                    {activeSet && (
                      <span className="text-[10px] text-neutral-800 dark:text-neutral-400 font-medium">10s auto-end</span>
                    )}
                  </div>

                  {/* Rest Counter (Live when resting after set completion) */}
                  {isResting && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping" />
                        <span className="text-xs font-black text-emerald-950 dark:text-emerald-300">
                          Rest Counter
                        </span>
                      </div>
                      <span className="font-mono font-black text-sm text-emerald-800 dark:text-emerald-400">
                        {formatDuration(restDuration)}
                      </span>
                    </div>
                  )}

                  {/* Action: End Set or Start Next Set */}
                  <div className="mt-3">
                    {activeSet ? (
                      <button
                        onClick={() => endActiveSet()}
                        className="w-full py-2.5 rounded-full text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-all cursor-pointer"
                      >
                        End Set {activeSet.setNumber}
                      </button>
                    ) : isResting ? (
                      <button
                        onClick={() => startNextSet()}
                        className="w-full py-2.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
                      >
                        Start Set {currentSetNumber + 1}
                      </button>
                    ) : (
                      <p className="text-[11px] text-neutral-800 dark:text-neutral-400 font-bold italic text-center">
                        Perform your first rep to start Set 1
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Precision Score */}
                <div className="pt-4 border-t border-neutral-300 dark:border-white/5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-black dark:text-neutral-300 font-black uppercase tracking-wider text-[11px]">
                      Form Precision
                    </span>
                    <span className={`font-black ${telemetry.formScore >= 80 ? 'text-green-600 dark:text-green-500' : 'text-orange-600 dark:text-orange-500'}`}>
                      {telemetry.formScore}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${telemetry.formScore}%`,
                        backgroundColor: telemetry.formScore >= 80 ? '#22c55e' : '#ea580c',
                      }}
                    />
                  </div>
                </div>

                {/* Exercise & Time Summary */}
                <div className="pt-4 border-t border-neutral-300 dark:border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-800 dark:text-neutral-400 font-bold">{activeExercise === 'auto' ? 'Auto-Detected:' : 'Exercise:'}</span>
                    <span className="font-black text-black dark:text-neutral-100">
                      {telemetry.detectedInfo?.name || activeExercise}
                    </span>
                  </div>
                  {sessionStartTimeFormatted && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800 dark:text-neutral-400 font-bold">Started:</span>
                      <span className="font-mono text-black dark:text-neutral-300 font-bold">
                        {sessionStartTimeFormatted}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-800 dark:text-neutral-400 font-bold">Duration:</span>
                    <span className="font-mono font-black text-orange-600 dark:text-orange-500">
                      {formatDuration(workoutDuration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Minimal Clean Action Buttons */}
              <div className="pt-6 border-t border-neutral-300 dark:border-white/5 space-y-2 mt-6">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      darkMode
                        ? 'border-white/10 text-neutral-200 hover:bg-white/5'
                        : 'border-neutral-900 text-black hover:bg-neutral-100'
                    }`}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={handleResetReps}
                    className={`py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      darkMode
                        ? 'border-white/10 text-neutral-200 hover:bg-white/5'
                        : 'border-neutral-900 text-black hover:bg-neutral-100'
                    }`}
                  >
                    Reset
                  </button>
                </div>

                <button
                  onClick={handleFinishWorkout}
                  className="w-full py-3 rounded-full text-xs font-black bg-red-600 hover:bg-red-500 text-white shadow-sm transition-all cursor-pointer"
                >
                  Finish Workout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Set Tracker Progression Stepper (Moved to Bottom) */}
        <div className="mt-6">
          <div className={`p-6 rounded-2xl border ${
            darkMode ? 'bg-[#15151e] border-white/5' : 'bg-white border-neutral-300 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-300 dark:border-white/5">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  Set History & Progression
                </h3>
                <p className="text-xs text-neutral-800 dark:text-neutral-300 font-medium mt-0.5">
                  Sets auto-record below upon completion or after 10 seconds of rest
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400">
                10s Auto-End
              </span>
            </div>

            <SetTrackerStepper
              exerciseGroups={exerciseGroups}
              activeSet={activeSet}
              currentExercise={currentExercise}
              now={trackerNow}
              onEndSet={endActiveSet}
            />
          </div>
        </div>

        {/* Minimal Performance Summary Modal */}
        {summaryData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className={`w-full max-w-md p-8 rounded-2xl border text-center shadow-xl ${
              darkMode ? 'bg-[#15151e] border-white/10' : 'bg-white border-neutral-300'
            }`}>
              <h2 className="text-2xl font-black mb-1 text-black dark:text-white">Workout Complete</h2>
              <p className="text-xs text-neutral-800 dark:text-neutral-400 uppercase tracking-wider font-bold mb-6">
                {summaryData.exercise} Summary
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-4 rounded-xl bg-neutral-100 dark:bg-white/5">
                  <span className="text-[10px] font-black uppercase text-black dark:text-neutral-400 block mb-1">
                    {telemetry.exercise === 'plank' ? 'Hold Time' : 'Reps Completed'}
                  </span>
                  <span className="text-3xl font-extrabold text-orange-600">
                    {telemetry.exercise === 'plank' ? `${summaryData.reps}s` : summaryData.reps}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-100 dark:bg-white/5">
                  <span className="text-[10px] font-black uppercase text-black dark:text-neutral-400 block mb-1">
                    Form Score
                  </span>
                  <span className="text-3xl font-extrabold text-orange-600">
                    {summaryData.avgFormScore}%
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-100 dark:bg-white/5">
                  <span className="text-[10px] font-black uppercase text-black dark:text-neutral-400 block mb-1">
                    Duration
                  </span>
                  <span className="text-lg font-black font-mono text-black dark:text-white">
                    {formatDuration(summaryData.duration)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-100 dark:bg-white/5">
                  <span className="text-[10px] font-black uppercase text-black dark:text-neutral-400 block mb-1">
                    Est. Calories
                  </span>
                  <span className="text-lg font-black font-mono text-black dark:text-white">
                    {summaryData.calories} kcal
                  </span>
                </div>
              </div>

              {/* Sets Summary Breakdown */}
              {summaryData.sets && Object.keys(summaryData.sets).length > 0 && (
                <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-white/5 mb-6 text-left max-h-48 overflow-y-auto">
                  <span className="block text-[10px] uppercase font-black text-black dark:text-neutral-400 mb-2">
                    Sets Breakdown
                  </span>
                  <div className="space-y-3">
                    {Object.entries(summaryData.sets).map(([exKey, setsList]) => {
                      const exInfo = EXERCISE_INFO[exKey] || { name: exKey.toUpperCase() };
                      return (
                        <div key={exKey} className="space-y-1">
                          <div className="text-xs font-black text-black dark:text-neutral-100">
                            {exInfo.name}
                          </div>
                          {setsList.map((s) => (
                            <div
                              key={s.setNumber}
                              className="flex items-center justify-between font-mono text-[11px] text-black dark:text-neutral-300 font-bold pl-2"
                            >
                              <span>Set {s.setNumber}: {s.reps} {exKey === 'plank' ? 'secs' : 'reps'}</span>
                              <span>{formatDuration(s.duration)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Start and End Timestamps */}
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-white/5 mb-6 text-xs flex items-center justify-around text-neutral-800 dark:text-neutral-400">
                <div>
                  <span className="block text-[10px] uppercase font-black text-black dark:text-neutral-400">Started</span>
                  <span className="font-mono font-black text-black dark:text-neutral-200">
                    {summaryData.sessionStarted}
                  </span>
                </div>
                <div className="h-5 w-px bg-neutral-400 dark:bg-white/10" />
                <div>
                  <span className="block text-[10px] uppercase font-black text-black dark:text-neutral-400">Finished</span>
                  <span className="font-mono font-black text-black dark:text-neutral-200">
                    {summaryData.sessionCompleted}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    setSummaryData(null);
                    setWorkoutDuration(0);
                    resetAllSets();
                    handleResetReps();
                    startCamera();
                  }}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-all cursor-pointer"
                >
                  New Session
                </button>
                <Link
                  to="/"
                  className="flex-1 py-2.5 rounded-full text-xs font-bold border border-neutral-900 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-black dark:text-neutral-300 transition-all text-center"
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
