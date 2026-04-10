import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QRGenerator({ data, size = 200, onDownload }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current && data) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 2,
        color: {
          dark: '#2563eb',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      }, (error) => {
        if (error) {
          console.error('QR Generation Error:', error)
          toast.error('Failed to generate QR code')
        }
      })
    }
  }, [data, size])

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.download = `event-qr-${Date.now()}.png`
      link.href = canvasRef.current.toDataURL()
      link.click()
      toast.success('QR code downloaded successfully')
      
      if (onDownload) {
        onDownload()
      }
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ width: size, height: size }}>
        <p className="text-gray-500 text-sm">No QR data</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas 
        ref={canvasRef} 
        className="border-2 border-gray-200 rounded-lg p-2 bg-white shadow-lg"
        style={{ width: size, height: size }}
      />
      <button
        onClick={handleDownload}
        className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700"
      >
        <Download className="h-4 w-4" />
        <span>Download QR Code</span>
      </button>
    </div>
  )
}