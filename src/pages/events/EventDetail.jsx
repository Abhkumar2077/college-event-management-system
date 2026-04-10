import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Clock, User, CheckCircle, ArrowLeft } from 'lucide-react'
import { eventAPI, registrationAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [registrationData, setRegistrationData] = useState(null)

  useEffect(() => {
    loadEventData()
    checkRegistrationStatus()
  }, [id])

  const loadEventData = async () => {
    try {
      const response = await eventAPI.getById(id)
      setEvent(response.data)
    } catch (error) {
      console.error('Error loading event:', error)
      toast.error('Failed to load event details')
    } finally {
      setLoading(false)
    }
  }

  const checkRegistrationStatus = async () => {
    try {
      const response = await registrationAPI.checkRegistration(id)
      setIsRegistered(response.data.isRegistered)
      if (response.data.registration) {
        setRegistrationData(response.data.registration)
      }
    } catch (error) {
      console.error('Error checking registration:', error)
    }
  }

  const handleRegister = async () => {
    setRegistering(true)
    try {
      const response = await registrationAPI.register(id)
      setIsRegistered(true)
      setRegistrationData(response.data.registration)
      toast.success('Successfully registered for the event!')
      
      // Show QR code option
      toast.success('Check your dashboard for QR code')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.message || 'Failed to register')
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Event not found</p>
        <button onClick={() => navigate('/events')} className="btn-primary mt-4">
          Back to Events
        </button>
      </div>
    )
  }

  const availableSeats = event.capacity - (event.registeredCount || 0)
  const registrationCloseAt = event.register_till
    ? new Date(`${event.register_till}T${event.register_till_time || '23:59'}:00`)
    : null
  const isRegistrationClosed = Boolean(registrationCloseAt && new Date() >= registrationCloseAt)

  return (
    <div>
      <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="card">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.name}</h1>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-2 text-primary-600" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2 text-primary-600" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <User className="h-5 w-5 mr-2 text-primary-600" />
                <span>{event.coordinator}</span>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h2>
              <p className="text-gray-600 leading-relaxed">{event.description}</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Info</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Capacity</span>
                <span className="font-semibold">{event.capacity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Registered</span>
                <span className="font-semibold text-primary-600">{event.registeredCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Seats Available</span>
                <span className="font-semibold">{availableSeats}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Register Till</span>
                <span className="font-semibold">{(event.register_till || event.date)} {event.register_till_time || '23:59'}</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div 
                className="bg-primary-600 rounded-full h-2 transition-all"
                style={{ width: `${((event.registeredCount || 0) / event.capacity) * 100}%` }}
              ></div>
            </div>
            
            {isRegistered ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-semibold">You are registered!</p>
                <p className="text-green-600 text-sm mt-1">Check your dashboard for QR code</p>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="mt-3 btn-primary text-sm"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <button 
                onClick={handleRegister}
                disabled={registering || availableSeats <= 0 || isRegistrationClosed}
                className="btn-primary w-full"
              >
                {registering ? 'Registering...' : isRegistrationClosed ? 'Registration Closed' : 'Register Now'}
              </button>
            )}
            
            {availableSeats <= 0 && !isRegistered && (
              <p className="text-red-600 text-sm text-center mt-3">Event is full!</p>
            )}
            {isRegistrationClosed && !isRegistered && (
              <p className="text-red-600 text-sm text-center mt-3">Registration deadline has passed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}