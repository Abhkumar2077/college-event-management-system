import { useState, useEffect } from 'react'
import { Calendar, Ticket, QrCode, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { registrationAPI, eventAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function StudentDashboard() {
  const [registeredEvents, setRegisteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'))
      setUser(currentUser)
      
      console.log('Fetching user registrations...')
      
      // Fetch registrations from backend
      const registrationsResponse = await registrationAPI.getMyRegistrations()
      console.log('Registrations from backend:', registrationsResponse.data)
      
      // Fetch all events to get details
      const eventsResponse = await eventAPI.getAll()
      const allEvents = eventsResponse.data
      
      // Map registrations to event details
      const registeredEventsData = registrationsResponse.data.map(reg => {
        const event = allEvents.find(e => e.id === reg.event_id)
        return {
          id: event?.id,
          name: event?.name,
          date: event?.date,
          time: event?.time,
          venue: event?.venue,
          status: reg.attendance_status,
          registrationId: reg.id,
          checkInTime: reg.check_in_time
        }
      }).filter(e => e.id)
      
      setRegisteredEvents(registeredEventsData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Registered Events', value: registeredEvents.length, icon: Ticket, color: 'bg-blue-500' },
    { label: 'Attended Events', value: registeredEvents.filter(e => e.status === 'checked_in').length, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Upcoming Events', value: registeredEvents.filter(e => e.status !== 'checked_in').length, icon: Calendar, color: 'bg-purple-500' }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Student'}!</p>
        </div>
        <button onClick={loadDashboardData} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Browse Events Button */}
      <div className="mb-6">
        <Link to="/events">
          <button className="btn-primary w-full md:w-auto">
            Browse Available Events
          </button>
        </Link>
      </div>

      {/* Registered Events */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Registered Events</h2>
        {registeredEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No events registered yet</p>
            <Link to="/events" className="btn-primary inline-block mt-4">Browse Events</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {registeredEvents.map(event => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{event.name}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {event.date} at {event.time}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {event.venue}
                      </span>
                    </div>
                    {event.status === 'checked_in' && (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        <CheckCircle className="h-3 w-3" />
                        Attended on {new Date(event.checkInTime).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Link to={`/my-qr/${event.id}`} state={{ eventName: event.name, eventDate: event.date, eventVenue: event.venue }}>
                      <button className="btn-secondary flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        Show QR
                      </button>
                    </Link>
                    <Link to={`/events/${event.id}`}>
                      <button className="btn-primary">
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}