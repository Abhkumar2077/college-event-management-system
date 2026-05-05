import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, Search, Filter, RefreshCw, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { eventAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function EventListing() {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
  try {
    setLoading(true)
    console.log('Fetching events from backend...')
    const response = await eventAPI.getAll()
    console.log('Events received:', response.data)
    setEvents(response.data)
    setFilteredEvents(response.data)
  } catch (error) {
    console.error('Error loading events:', error)
    toast.error('Failed to load events. Please make sure backend is running.')
    // Remove localStorage fallback
    setEvents([])
    setFilteredEvents([])
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    let filtered = events
    
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory)
    }
    
    setFilteredEvents(filtered)
  }, [searchTerm, selectedCategory, events])

  // Helper function to check if registration is still open
  const isRegistrationOpen = (event) => {
    if (!event.register_till) return true
    const closeDateTime = new Date(`${event.register_till}T${event.register_till_time || '23:59'}:00`)
    return new Date() < closeDateTime
  }

  // Get registration status text and color
  const getRegistrationStatus = (event) => {
    if (!isRegistrationOpen(event)) {
      return { text: 'Registration Closed', color: 'text-red-600', bgColor: 'bg-red-50' }
    }
    if (event.registeredCount >= event.capacity) {
      return { text: 'Event Full', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    }
    return { text: 'Open', color: 'text-green-600', bgColor: 'bg-green-50' }
  }

  const categories = [
    { value: 'all', label: 'All Events' },
    { value: 'technical', label: 'Technical' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'sports', label: 'Sports' },
    { value: 'workshop', label: 'Workshop' }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upcoming Events</h1>
        <p className="text-gray-600">Discover and register for exciting events</p>
      </div>

      <div className="card mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              className="input-field pl-10 appearance-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <button onClick={loadEvents} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No events found</p>
          <p className="text-gray-400">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => {
            const regStatus = getRegistrationStatus(event)
            
            return (
              <div key={event.id} className="card hover:shadow-lg transition-shadow duration-300">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>
                    <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-xs font-semibold">
                      {event.category?.toUpperCase() || 'GENERAL'}
                    </span>
                  </div>
                  
                  {/* Registration Status Badge */}
                  <div className={`inline-block px-2 py-1 rounded-md text-xs font-semibold mb-3 ${regStatus.bgColor} ${regStatus.color}`}>
                    Registration: {regStatus.text}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {event.description || 'No description available'}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {event.date} at {event.time}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.venue}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      {event.registeredCount || 0} / {event.capacity} registered
                    </div>
                    
                    {/* Registration Deadline */}
                    {event.register_till && (
                      <div className="flex items-center text-sm text-orange-600">
                        <Clock className="h-4 w-4 mr-2" />
                        Register by: {new Date(event.register_till).toLocaleDateString()} at {event.register_till_time || '23:59'}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-primary-600 rounded-full h-2 transition-all duration-500"
                      style={{ width: `${((event.registeredCount || 0) / event.capacity) * 100}%` }}
                    ></div>
                  </div>
                  
                  <Link to={`/events/${event.id}`}>
                    <button className="btn-primary w-full">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}