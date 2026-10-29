import { useState, useRef, useCallback, useEffect } from 'react'

export function useCamera() {
  const [permissionStatus, setPermissionStatus] = useState('idle') // 'idle' | 'granted' | 'denied'
  const [isStreaming, setIsStreaming] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const startStream = useCallback(async (videoElement, facingMode = 'user') => {
    stopStream()
    setErrorMessage(null)

    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 20 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoElement) {
        videoElement.srcObject = stream
        await videoElement.play()
      }

      setPermissionStatus('granted')
      setIsStreaming(true)
      return stream
    } catch (err) {
      console.error('Camera access error:', err)
      setPermissionStatus('denied')
      setIsStreaming(false)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser settings to track workouts.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device was detected on your system.')
      } else {
        setErrorMessage(`Camera initialization failed: ${err.message || 'Unknown error'}`)
      }
      return null
    }
  }, [stopStream])

  const captureFrame = useCallback(
    (videoElement, maxWidth = 640, quality = 0.65) => {
      return new Promise((resolve) => {
        if (!videoElement || videoElement.readyState < 2) {
          resolve(null)
          return
        }

        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas')
        }

        const canvas = canvasRef.current
        const vw = videoElement.videoWidth || 640
        const vh = videoElement.videoHeight || 480

        const scale = Math.min(1.0, maxWidth / Math.max(vw, 1))
        canvas.width = Math.round(vw * scale)
        canvas.height = Math.round(vh * scale)

        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          resolve(null)
          return
        }

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            resolve(blob)
          },
          'image/jpeg',
          quality
        )
      })
    },
    []
  )

  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [stopStream])

  return {
    permissionStatus,
    isStreaming,
    errorMessage,
    startStream,
    stopStream,
    captureFrame,
  }
}

