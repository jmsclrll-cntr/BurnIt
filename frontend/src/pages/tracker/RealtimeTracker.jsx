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
  const [activeExercise, setActiveExercise] = useState('auto');
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

  // Start Camera Stream & initialize session start timestamp
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      await initMediaPipe();

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

      const nowFormatted = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setSessionStartTimeFormatted(nowFormatted);
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera initialization error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err.message || 'Unable to access webcam.'
      );
    }
  }, [initMediaPipe]);

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
      videoRef.current.srcObject = null;
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
                  isMirrored,
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
  }, [isCameraActive, isPaused, activeExercise, showJoints, showAngles, isMirrored, sessionStartTimeFormatted]);

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

  const handleFinishWorkout = () => {
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

          {/* Exercise Selector Pills - Clean Text Without Icons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {EXERCISES.map((ex) => {
              const isSelected = activeExercise === ex.id;
              return (
                <button
                  key={ex.id}
                  onClick={() => setActiveExercise(ex.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-sm'
                      : darkMode
                      ? 'bg-white/5 text-neutral-400 hover:text-white border border-white/10 hover:bg-white/10'
                      : 'bg-neutral-100 text-neutral-600 hover:text-black border border-neutral-200 hover:bg-neutral-200/60'
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
            <p className="text-xs text-neutral-400 leading-relaxed mb-3">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-5 py-2 rounded-full text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-all"
            >
              Retry Camera
            </button>
          </div>
        )}

        {/* Larger Camera View Layout (lg:col-span-9) paired with Unified Clean Sidebar (lg:col-span-3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Main Video View - Enlarged 9 Columns */}
          <div className="lg:col-span-9 flex flex-col">
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black/90 border border-neutral-200/40 dark:border-white/10 shadow-lg">
              {/* Webcam Video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-transform duration-200 ${
                  isMirrored ? '-scale-x-100' : ''
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
                    ? `AUTO (2s): ${telemetry.detectedInfo?.shortName || 'DETECTING'}`
                    : activeExercise}
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
            <div className={`p-6 rounded-2xl border flex-1 flex flex-col justify-between ${
              darkMode ? 'bg-[#15151e] border-white/5' : 'bg-white border-neutral-200/80 shadow-sm'
            }`}>
              <div className="space-y-6">
                {/* Reps / Hold Time */}
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">
                      {telemetry.exercise === 'plank' ? 'Hold Time' : 'Completed Reps'}
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
                    <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">Form Precision</span>
                    <span className={`font-bold ${telemetry.formScore >= 80 ? 'text-green-500' : 'text-orange-500'}`}>
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

                {/* Exercise & Time Summary */}
                <div className="pt-4 border-t border-neutral-100 dark:border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">{activeExercise === 'auto' ? 'Auto-Detected:' : 'Exercise:'}</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                      {telemetry.detectedInfo?.name || activeExercise}
                    </span>
                  </div>
                  {activeExercise === 'auto' && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Sample Interval:</span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300 font-medium">
                        Every 2.0s
                      </span>
                    </div>
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
                </div>
              </div>

              {/* Minimal Clean Action Buttons */}
              <div className="pt-6 border-t border-neutral-100 dark:border-white/5 space-y-2 mt-6">
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
                  >
                    Reset
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

        {/* Minimal Performance Summary Modal */}
        {summaryData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className={`w-full max-w-md p-8 rounded-2xl border text-center shadow-xl ${
              darkMode ? 'bg-[#15151e] border-white/10' : 'bg-white border-neutral-200'
            }`}>
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

              {/* Start and End Timestamps */}
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-white/5 mb-6 text-xs flex items-center justify-around text-neutral-400">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Started</span>
                  <span className="font-mono font-bold text-neutral-700 dark:text-neutral-200">
                    {summaryData.sessionStarted}
                  </span>
                </div>
                <div className="h-5 w-px bg-neutral-300 dark:bg-white/10" />
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Finished</span>
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
