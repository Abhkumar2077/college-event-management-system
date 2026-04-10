import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { X, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QRScannerModal({ eventId, onClose, onScanSuccess }) {
  const [scanning, setScanning] = useState(true)
  const [lastScan, setLastScan] = useState(null)
  const scannerRef = useRef(null)

  const handleScanSuccess = (decodedText) => {
    try {
      const qrData = JSON.parse(decodedText)
      
      // Verify event match
      if (qrData.eventId !== parseInt(eventId)) {
        toast.error('QR code is for a different event')
        return
      }
      
      setLastScan({
        success: true,
        data: qrData,
        message: `${qrData.name} checked in successfully!`
      })
      
      toast.success(`Welcome ${qrData.name}!`)
      
      if (onScanSuccess) {
        onScanSuccess(qrData)
      }
      
      setScanning(false)
    } catch {
      setLastScan({
        success: false,
        message: 'Invalid QR code'
      })
      toast.error('Invalid QR code')
    }
  }

  useEffect(() => {
    if (!scanning) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
      return
    }

    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    })

    scannerRef.current = scanner
    scanner.render(handleScanSuccess)

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [scanning, eventId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          {scanning ? (
            <div id="qr-reader" className="w-full"></div>
          ) : (
            <div className="text-center">
              {lastScan?.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-semibold">{lastScan.message}</p>
                  <p className="text-green-600 text-sm mt-1">
                    Student: {lastScan.data.name}<br />
                    Roll No: {lastScan.data.rollNumber}
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 font-semibold">{lastScan.message}</p>
                </div>
              )}
              
              <button
                onClick={() => {
                  setScanning(true)
                  setLastScan(null)
                }}
                className="btn-primary w-full mt-4"
              >
                Scan Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}