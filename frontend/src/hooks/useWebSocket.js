import { useState, useRef, useCallback, useEffect } from 'react'

export function useWorkoutWebSocket(sessionId, onPoseData) {
  const [connectionStatus, setConnectionStatus] = useState('connecting') // 'connecting' | 'connected' | 'disconnected' | 'error'
  const [latencyMs, setLatencyMs] = useState(0)
  const wsRef = useRef(null)
  const isAwaitingResponseRef = useRef(false)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptRef = useRef(0)
  const sendTimestampRef = useRef(0)
  const onPoseDataRef = useRef(onPoseData)

  useEffect(() => {
    onPoseDataRef.current = onPoseData
  }, [onPoseData])

  const connectRef = useRef(null)

  const connect = useCallback(() => {
    if (!sessionId) return

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname || 'localhost'
    const wsUrl = `${protocol}//${host}:8000/ws/workout/${sessionId}`

    try {
      const ws = new WebSocket(wsUrl)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        setConnectionStatus('connected')
        reconnectAttemptRef.current = 0
        isAwaitingResponseRef.current = false
      }

      ws.onmessage = (event) => {
        isAwaitingResponseRef.current = false
        if (sendTimestampRef.current > 0) {
          const rtt = Math.round(performance.now() - sendTimestampRef.current)
          setLatencyMs(rtt)
        }

        try {
          const data = JSON.parse(event.data)
          if (onPoseDataRef.current) {
            onPoseDataRef.current(data)
          }
        } catch (err) {
          console.error('Failed parsing backend WS message:', err)
        }
      }

      ws.onerror = (err) => {
        console.warn('Workout WebSocket error:', err)
        setConnectionStatus('error')
        isAwaitingResponseRef.current = false
      }

      ws.onclose = () => {
        setConnectionStatus('disconnected')
        isAwaitingResponseRef.current = false

        // Exponential backoff reconnect
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 10000)
        reconnectAttemptRef.current += 1
        reconnectTimeoutRef.current = setTimeout(() => {
          if (connectRef.current) {
            connectRef.current()
          }
        }, delay)
      }
    } catch (err) {
      console.error('Failed creating WebSocket:', err)
      setTimeout(() => {
        setConnectionStatus('error')
      }, 0)
    }
  }, [sessionId])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnectionStatus('disconnected')
    isAwaitingResponseRef.current = false
  }, [])

  const sendFrame = useCallback((frameBlob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false
    }

    // Drop frame if backend is still processing previous frame (strictly stay real-time)
    if (isAwaitingResponseRef.current) {
      return false
    }

    if (!frameBlob) return false

    try {
      isAwaitingResponseRef.current = true
      sendTimestampRef.current = performance.now()
      wsRef.current.send(frameBlob)
      return true
    } catch (err) {
      isAwaitingResponseRef.current = false
      console.error('Failed sending frame:', err)
      return false
    }
  }, [])

  const sendControl = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(payload))
        return true
      } catch (err) {
        console.error('Failed sending control message:', err)
        return false
      }
    }
    return false
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    connectionStatus,
    latencyMs,
    sendFrame,
    sendControl,
    reconnect: connect,
  }
}
