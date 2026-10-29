import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Square,
  Upload,
  Download,
  Cpu,
} from 'lucide-react'
import PageWrapper from '../../components/PageWrapper'
import { useTheme } from '../../hooks/useTheme'
import { useCamera } from '../../hooks/useCamera'
import { useWorkoutWebSocket } from '../../hooks/useWebSocket'
import { drawPoseSkeleton } from '../../lib/skeletonRenderer'

export default function AdminRecorder() {
  const { darkMode } = useTheme()
  const [sessionId] = useState(() => 'admin_rec_' + Math.random().toString(36).substring(2, 9))

  // Dataset label configuration
  const [exercise, setExercise] = useState('squat')
  const [phase, setPhase] = useState('down')
  const [formLabel, setFormLabel] = useState('correct')
  const [errorType, setErrorType] = useState('none')
  const [subjectId, setSubjectId] = useState('sub_01')
  const [cameraView, setCameraView] = useState('front')

  // Recording & Telemetry state
  const [isRecording, setIsRecording] = useState(false)
  const [recordedFrames, setRecordedFrames] = useState(0)
  const [datasetStats, setDatasetStats] = useState(null)
  const [trainingResult, setTrainingResult] = useState(null)
  const [isTraining, setIsTraining] = useState(false)
  const [importStatus, setImportStatus] = useState(null)

  // Camera & Video
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const { isStreaming, startStream, stopStream, captureFrame } = useCamera()

  const [poseData, setPoseData] = useState({ landmarks: [], form_errors: [] })

  const handlePose = useCallback((data) => {
    setPoseData(data)
  }, [])

  const { connectionStatus, latencyMs, sendFrame } = useWorkoutWebSocket(sessionId, handlePose)

  // Fetch dataset stats from backend
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/dataset/stats')
      if (res.ok) {
        const data = await res.json()
        setDatasetStats(data)
      }
    } catch {
      // ignore if backend offline
    }
  }, [])

  // Initialize camera automatically on mount
  useEffect(() => {
    if (videoRef.current) {
      startStream(videoRef.current)
    }
    const timer = setTimeout(() => {
      fetchStats()
    }, 100)
    return () => {
      clearTimeout(timer)
      stopStream()
    }
  }, [startStream, stopStream, fetchStats])

  // Frame streaming loop
  useEffect(() => {
    let intervalId = null
    if (isStreaming) {
      intervalId = setInterval(async () => {
        if (videoRef.current) {
          const blob = await captureFrame(videoRef.current, 640, 0.65)
          if (blob) {
            sendFrame(blob)
            if (isRecording) {
              setRecordedFrames((prev) => prev + 1)
            }
          }
        }
      }, 85)
    }
    return () => clearInterval(intervalId)
  }, [isStreaming, isRecording, captureFrame, sendFrame])

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (poseData.landmarks && poseData.landmarks.length > 0) {
      drawPoseSkeleton(ctx, poseData.landmarks, canvas.width, canvas.height, {
        formErrors: formLabel === 'incorrect' ? ['manual_error'] : [],
        isMirrored: true,
        goodColor: '#ea580c',
        errorColor: '#ef4444',
      })
    }
  }, [poseData, formLabel])

  // Toggle Recording
  const handleToggleRecording = async () => {
    if (!isRecording) {
      try {
        const res = await fetch('http://localhost:8000/api/dataset/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise,
            phase,
            form_label: formLabel,
            error_type: errorType,
            subject_id: subjectId,
            camera_view: cameraView,
          }),
        })
        if (res.ok) {
          setIsRecording(true)
          setRecordedFrames(0)
        }
      } catch (err) {
        console.error('Failed to start recording:', err)
      }
    } else {
      try {
        await fetch('http://localhost:8000/api/dataset/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
        setIsRecording(false)
        fetchStats()
      } catch (err) {
        console.error('Failed to stop recording:', err)
        setIsRecording(false)
      }
    }
  }

  // Video Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportStatus('Extracting frames with backend pose landmarker...')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('exercise', exercise)
    formData.append('phase', phase)
    formData.append('form_label', formLabel)
    formData.append('error_type', errorType)
    formData.append('subject_id', subjectId)
    formData.append('camera_view', cameraView)

    try {
      const res = await fetch('http://localhost:8000/api/dataset/import-video', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const result = await res.json()
        setImportStatus(`Success! Recorded ${result.landmarks_recorded} frames into dataset.`)
        fetchStats()
      } else {
        setImportStatus('Error importing video file.')
      }
    } catch (err) {
      setImportStatus(`Import failed: ${err.message}`)
    }
  }

  // Model Training
  const handleTrainModel = async () => {
    setIsTraining(true)
    setTrainingResult(null)
    try {
      const res = await fetch('http://localhost:8000/api/model/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n_estimators: 100, test_size: 0.2 }),
      })
      const data = await res.json()
      setTrainingResult(data)
    } catch (err) {
      setTrainingResult({ success: false, error: err.message })
    } finally {
      setIsTraining(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
            Internal ML Pipeline
          </span>
          <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight mt-1 ${darkMode ? 'text-white' : 'text-[#202124]'}`}>
            Dataset Recorder & Model Trainer
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-neutral-400' : 'text-[#5F6368]'}`}>
            Capture ground-truth pose vectors, label movement phases, and train the RandomForest exercise classifier.
          </p>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Webcam & Skeleton Feed */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative rounded-3xl overflow-hidden border border-neutral-800 shadow-xl bg-neutral-950 aspect-[4/3]">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

              {/* Status Header */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white">
                  <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span>WS: {latencyMs}ms</span>
                </div>

                {isRecording && (
                  <div className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span>Recording ({recordedFrames} frames)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recording Action Bar */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleToggleRecording}
                className={`flex-1 inline-flex items-center justify-center gap-2.5 py-4 rounded-full text-white text-sm font-bold uppercase tracking-wider shadow-lg transition-all ${
                  isRecording
                    ? 'bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900 border border-red-500/50'
                    : 'bg-red-600 hover:bg-red-500 active:bg-red-700'
                }`}
              >
                {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isRecording ? 'Stop Recording' : 'Start Recording Data'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`px-6 py-4 rounded-full border text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  darkMode ? 'bg-[#15151e] border-neutral-800 hover:bg-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-800 shadow-sm'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Import Video</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {importStatus && (
              <div className="p-3 rounded-xl bg-orange-600/10 border border-orange-600/30 text-orange-400 text-xs">
                {importStatus}
              </div>
            )}
          </div>

          {/* Right Column: Ground-Truth Label Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div
              className={`p-6 rounded-2xl border transition-colors ${
                darkMode ? 'bg-[#15151e] border-neutral-800' : 'bg-[#F8F9FA] border-neutral-200/80 shadow-sm'
              }`}
            >
              <h3 className={`text-base font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                Label Configuration
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-400">Exercise</label>
                  <select
                    value={exercise}
                    onChange={(e) => setExercise(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border font-medium ${
                      darkMode ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                    }`}
                  >
                    <option value="squat">Squat</option>
                    <option value="pushup">Push-up</option>
                    <option value="plank">Plank</option>
                    <option value="jumping_jack">Jumping Jack</option>
                    <option value="bicep_curl">Bicep Curl</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-400">Phase</label>
                    <select
                      value={phase}
                      onChange={(e) => setPhase(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border font-medium ${
                        darkMode ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                      }`}
                    >
                      <option value="down">Down (Bottom)</option>
                      <option value="up">Up (Top)</option>
                      <option value="hold">Hold</option>
                      <option value="dynamic">Full Cycle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-neutral-400">Form Quality</label>
                    <select
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border font-medium ${
                        darkMode ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                      }`}
                    >
                      <option value="correct">Correct Form</option>
                      <option value="incorrect">Incorrect Form</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-400">Error Classification</label>
                  <select
                    value={errorType}
                    onChange={(e) => setErrorType(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border font-medium ${
                      darkMode ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                    }`}
                  >
                    <option value="none">None (Clean Form)</option>
                    <option value="knees_caving">Knees Caving (Valgus)</option>
                    <option value="back_rounding">Back Rounding</option>
                    <option value="shallow_depth">Shallow Depth</option>
                    <option value="hips_sagging">Hips Sagging</option>
                    <option value="hips_piking">Hips Piking</option>
                    <option value="elbow_flare">Elbow Flare</option>
                    <option value="elbow_drift">Elbow Drift</option>
                    <option value="back_swinging">Back Swinging</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-400">Subject ID</label>
                    <input
                      type="text"
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border font-medium ${
                        darkMode ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-neutral-400">Camera View</label>
                    <select
                      value={cameraView}
                      onChange={(e) => setCameraView(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border font-medium ${
                        darkMode ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                      }`}
                    >
                      <option value="front">Front Facing</option>
                      <option value="side_45">45° Diagonal</option>
                      <option value="side_90">90° True Profile</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Dataset Statistics & Export */}
            <div
              className={`p-6 rounded-2xl border transition-colors ${
                darkMode ? 'bg-[#15151e] border-neutral-800' : 'bg-[#F8F9FA] border-neutral-200/80 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-base font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                  Dataset Records
                </h3>
                <span className="text-xs font-mono text-orange-600 font-bold">
                  {datasetStats?.total_frames || 0} Frames Total
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {['squat', 'pushup', 'plank', 'jumping_jack', 'bicep_curl'].map((ex) => (
                  <a
                    key={ex}
                    href={`http://localhost:8000/api/dataset/export/${ex}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-colors ${
                      darkMode ? 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white' : 'bg-white border-neutral-200 text-neutral-700 shadow-sm'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{ex} CSV</span>
                  </a>
                ))}
              </div>

              {/* Model Training Trigger */}
              <div className="pt-4 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={handleTrainModel}
                  disabled={isTraining}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all"
                >
                  <Cpu className="w-4 h-4" />
                  <span>{isTraining ? 'Training Classifier...' : 'Train ML Classifier (RandomForest)'}</span>
                </button>

                {trainingResult && (
                  <div className="mt-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono space-y-1">
                    {trainingResult.success ? (
                      <>
                        <div className="text-emerald-400 font-bold">✓ Training Succeeded!</div>
                        <div className="text-neutral-300">Accuracy: {(trainingResult.accuracy * 100).toFixed(2)}%</div>
                        <div className="text-neutral-400">Total Samples: {trainingResult.total_samples}</div>
                      </>
                    ) : (
                      <div className="text-red-400">Error: {trainingResult.error}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
