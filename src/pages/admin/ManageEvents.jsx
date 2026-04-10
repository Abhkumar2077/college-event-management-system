import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Edit, Trash2, Eye, Plus, Search, Calendar, MapPin, Users, Camera } from 'lucide-react'
import { eventAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function ManageEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await eventAPI.getAll()
      console.log('Events loaded:', response.data)
      setEvents(response.data)
      setFilteredEvents(response.data)
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const filtered = events.filter(event =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.category && event.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.venue && event.venue.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredEvents(filtered)
  }, [searchTerm, events])

  const handleDelete = async () => {
    if (selectedEvent) {
      try {
        await eventAPI.delete(selectedEvent.id)
        toast.success(`Event "${selectedEvent.name}" deleted successfully!`)
        loadEvents() // Reload events
        setShowDeleteModal(false)
        setSelectedEvent(null)
      } catch (error) {
        console.error('Delete error:', error)
        toast.error('Failed to delete event')
      }
    }
  }

  const getStatusColor = (status, date) => {
    if (status === 'completed') return 'bg-gray-100 text-gray-700'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const eventDate = new Date(date)
    eventDate.setHours(0, 0, 0, 0)
    
    if (eventDate < today) return 'bg-red-100 text-red-700'
    if (eventDate.toDateString() === today.toDateString()) return 'bg-orange-100 text-orange-700'
    return 'bg-green-100 text-green-700'
  }

  const getStatusText = (status, date) => {
    if (status === 'completed') return 'Completed'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const eventDate = new Date(date)
    eventDate.setHours(0, 0, 0, 0)
    
    if (eventDate < today) return 'Expired'
    if (eventDate.toDateString() === today.toDateString()) return 'Today'
    return 'Upcoming'
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Manage Events</h1>
          <p className="text-gray-600 mt-1">Create, edit, or delete events</p>
        </div>
        <Link to="/admin/create-event">
          <button className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Event
          </button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events by name, category, or venue..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Event Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date & Time</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Venue</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Registrations</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No events found. Create your first event!
                </td>
              </tr>
            ) : (
              filteredEvents.map(event => (
                <tr key={event.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{event.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{event.category}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      <div>{event.date}</div>
                      <div className="text-xs text-gray-500">{event.time}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {event.venue}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      <div>{event.registeredCount || 0} / {event.capacity}</div>
                      <div className="w-24 mt-1 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-primary-600 rounded-full h-1.5"
                          style={{ width: `${((event.registeredCount || 0) / event.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status, event.date)}`}>
                      {getStatusText(event.status, event.date)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/admin/edit-event/${event.id}`)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit Event"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowDeleteModal(true)
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete Event"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => navigate(`/admin/scanner/${event.id}`)}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded transition"
                        title="Scan QR"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => navigate(`/admin/reports`)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                        title="View Reports"
                      >
                        <Users className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Event</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<span className="font-semibold">{selectedEvent.name}</span>"?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedEvent(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}