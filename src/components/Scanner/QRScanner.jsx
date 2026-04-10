import { useEffect, useRef, useState } from 'react'
import { X, Camera, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { attendanceAPI } from '../../services/api'
import toast from 'react-hot-toast'
import jsQR from 'jsqr'

export default function QRScannerModal({ eventId, eventName, onClose, onScanSuccess }) {
  const [lastScan, setLastScan] = useState(null)
  const [scanning, setScanning] = useState(true)
  const [cameraError, setCameraError] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const parseErrorToastTimeRef = useRef(0)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraError(false)
      startScanning()
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError(true)
      toast.error('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const startScanning = () => {
    scanQRCode()
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d', { willReadFrequently: true })

    if (!context) {
      requestAnimationFrame(scanQRCode)
      return
    }

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, canvas.width, canvas.height)
      
      if (code) {
        const isHandled = handleScan(code.data)
        if (isHandled) {
          return
        }
      }
    }
    
    requestAnimationFrame(scanQRCode)
  }

  const handleScan = async (decodedText) => {
    const trimmedText = decodedText?.trim()

    // Ignore non-JSON codes and keep scanning.
    if (!trimmedText || !trimmedText.startsWith('{') || !trimmedText.endsWith('}')) {
      return false
    }

    try {
      const qrData = JSON.parse(trimmedText)
      
      console.log('Scanned:', qrData)
      
      if (qrData.eventId !== parseInt(eventId)) {
        setLastScan({
          success: false,
          message: `Wrong event! This QR is for "${qrData.eventName}"`
        })
        toast.error(`Wrong event!`)
        setScanning(false)
        stopCamera()
        return true
      }
      
      // Call API to check in
      try {
        const response = await attendanceAPI.scanQR({
          userId: qrData.userId,
          eventId: parseInt(eventId)
        })
        
        setLastScan({
          success: true,
          data: qrData,
          message: response.data.message,
          time: new Date().toLocaleTimeString()
        })
        
        toast.success(response.data.message)
      } catch (apiError) {
        const errorMessage = apiError.response?.data?.message || 'Check-in failed'
        setLastScan({
          success: false,
          message: errorMessage
        })
        toast.error(errorMessage)
      }
      
      if (onScanSuccess) {
        onScanSuccess(qrData)
      }
      setScanning(false)
      stopCamera()
      return true
      
    } catch (error) {
      console.error('QR Scan Error:', error)
      const now = Date.now()
      if (now - parseErrorToastTimeRef.current > 1500) {
        toast.error('Invalid QR code format')
        parseErrorToastTimeRef.current = now
      }
      return false
    }
  }

  const resetScanner = () => {
    setLastScan(null)
    setScanning(true)
    startCamera()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Scan QR Code</h3>
          </div>
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Event Info */}
        <div className="bg-blue-50 px-4 py-2">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Event:</span> {eventName}
          </p>
        </div>
        
        <div className="p-4">
          {cameraError ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <Camera className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-yellow-800 mb-2">Camera Error</h4>
                <p className="text-yellow-700 mb-4">
                  Please allow camera access and refresh
                </p>
                <button onClick={startCamera} className="btn-primary">
                  Try Again
                </button>
              </div>
            </div>
          ) : scanning ? (
            <>
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full rounded-lg bg-black"
                  style={{ minHeight: '300px', objectFit: 'cover' }}
                  playsInline
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="absolute inset-0 border-2 border-primary-500 rounded-lg pointer-events-none m-8"></div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="flex justify-center gap-4">
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Camera Active
                  </div>
                  <button
                    onClick={resetScanner}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reset
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Position QR code in the center of the frame
                </p>
              </div>
            </>
          ) : (
            <div className="text-center">
              {lastScan?.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-3" />
                  <h4 className="text-xl font-semibold text-green-800 mb-2">Check-in Successful!</h4>
                  <p className="text-green-700">{lastScan.message}</p>
                  <div className="mt-4 p-3 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Student:</strong> {lastScan.data?.name}<br />
                      <strong>Roll No:</strong> {lastScan.data?.rollNumber}<br />
                      <strong>Time:</strong> {lastScan.time}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-3" />
                  <h4 className="text-xl font-semibold text-red-800 mb-2">Check-in Failed</h4>
                  <p className="text-red-700">{lastScan?.message}</p>
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                <button onClick={resetScanner} className="btn-primary flex-1">
                  Scan Another QR
                </button>
                <button
                  onClick={() => {
                    stopCamera()
                    onClose()
                  }}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}