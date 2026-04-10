import { useState } from 'react'
import { useParams } from 'react-router-dom'
import QRScanner from '../../components/Scanner/QRScanner'
import Card from '../../components/common/Card'

function EventScanner() {
  const { eventId } = useParams()
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scannedData, setScannedData] = useState(null)

  const handleScanSuccess = (data) => {
    setScannedData(data)
    console.log('Scanned:', data)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Event Scanner</h1>
      
      <Card>
        <p className="text-gray-600 mb-4">Event ID: {eventId}</p>
        <button
          onClick={() => setIsScannerOpen(true)}
          className="btn-primary"
        >
          Open Scanner
        </button>
        
        {scannedData && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">Scanned: {scannedData}</p>
          </div>
        )}
      </Card>

      {isScannerOpen && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  )
}

export default EventScanner
