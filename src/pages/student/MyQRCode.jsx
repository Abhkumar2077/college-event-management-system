import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Calendar, MapPin, Clock, ArrowLeft, Smartphone, CheckCircle, Download } from 'lucide-react'
import { registrationAPI, eventAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function MyQRCode() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [registration, setRegistration] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)

  useEffect(() => {
    loadData()
  }, [eventId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const currentUser = JSON.parse(localStorage.getItem('user'))
      setUser(currentUser)

      // Get event details from backend
      const eventResponse = await eventAPI.getById(eventId)
      setEvent(eventResponse.data)

      // Get user's registrations from backend
      const registrationsResponse = await registrationAPI.getMyRegistrations()
      console.log('All registrations:', registrationsResponse.data)
      
      const userRegistration = registrationsResponse.data.find(r => r.event_id === parseInt(eventId))
      console.log('Found registration:', userRegistration)
      
      if (userRegistration) {
        setRegistration(userRegistration)
        // Use QR code from backend registration
        if (userRegistration.qr_code) {
          console.log('QR code found in registration')
          setQrCodeUrl(userRegistration.qr_code)
        } else {
          console.log('No QR code in registration, generating new one')
          await generateAndSaveQRCode(currentUser, eventResponse.data, userRegistration.id)
        }
      } else {
        toast.error('Registration not found')
        navigate('/dashboard')
      }
      
    } catch (error) {
      console.error('Error loading QR data:', error)
      toast.error('Failed to load QR code')
    } finally {
      setLoading(false)
    }
  }

  const generateAndSaveQRCode = async (user, event, registrationId) => {
    const qrData = {
      userId: user.id,
      eventId: event.id,
      eventName: event.name,
      name: user.name,
      rollNumber: user.roll_number || 'N/A',
      email: user.email,
      department: user.department,
      timestamp: new Date().toISOString()
    }
    
    try {
      // Import QRCode library dynamically
      const QRCode = await import('qrcode')
      const qrUrl = await QRCode.default.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#2563eb',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error('QR Generation Error:', error)
      toast.error('Failed to generate QR code')
    }
  }

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.download = `qr_${event?.name}_${user?.roll_number || 'student'}.png`
      link.href = qrCodeUrl
      link.click()
      toast.success('QR code downloaded!')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const isCheckedIn = registration?.attendance_status === 'checked_in'

  return (
    <div>
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="mb-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Your Event QR Code</h1>
            <p className="text-gray-600 mt-2">Show this QR code at the event entrance for check-in</p>
          </div>

          {/* Event Info */}
          <div className="bg-gradient-to-r from-primary-50 to-indigo-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">{event?.name}</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {event?.date}
              </div>
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {event?.time}
              </div>
              <div className="flex items-center justify-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {event?.venue}
              </div>
            </div>
          </div>

          {/* Check-in Status */}
          {isCheckedIn && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Already Checked In!</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Checked in at {new Date(registration.check_in_time).toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* QR Code Display */}
          <div className="flex justify-center mb-6">
            {qrCodeUrl ? (
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-white shadow-lg">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-64 h-64 object-contain"
                  onError={() => {
                    console.error('Failed to load QR image')
                    toast.error('QR code image failed to load')
                  }}
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                <p className="text-gray-500 text-sm">Generating QR Code...</p>
              </div>
            )}
          </div>

          {/* Download Button */}
          {qrCodeUrl && (
            <button onClick={downloadQR} className="btn-secondary flex items-center justify-center gap-2 mb-4 w-full">
              <Download className="h-4 w-4" />
              Download QR Code
            </button>
          )}

          {/* Student Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Student:</span> {user?.name}<br />
              <span className="font-semibold">Roll Number:</span> {user?.roll_number || 'Not assigned'}<br />
              <span className="font-semibold">Email:</span> {user?.email}
            </p>
          </div>

          {/* Instructions */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Note:</span> This QR code contains your registration information. 
              The admin will scan this at the venue to mark your attendance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}