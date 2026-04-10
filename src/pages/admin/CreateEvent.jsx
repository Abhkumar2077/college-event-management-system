import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Clock, Save, X } from 'lucide-react'
import { eventAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function CreateEvent() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'technical',
    venue: '',
    capacity: '',
    date: '',
    register_till: '',
    register_till_time: '23:59',
    time: '',
    coordinator: '',
    coordinator_email: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const response = await eventAPI.create({
        ...formData,
        capacity: parseInt(formData.capacity)
      })
      
      console.log('Event created:', response.data)
      toast.success('Event created successfully!')
      navigate('/admin/events')
    } catch (error) {
      console.error('Create event error:', error)
      toast.error(error.response?.data?.message || 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  const categories = [
    { value: 'technical', label: 'Technical' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'sports', label: 'Sports' },
    { value: 'workshop', label: 'Workshop' }
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-600 mt-1">Fill in the details to create a new event</p>
        </div>
        <button onClick={() => navigate('/admin')} className="btn-secondary flex items-center gap-2">
          <X className="h-5 w-5" />
          Cancel
        </button>
      </div>

      <div className="card max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name *
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter event name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows="4"
              className="input-field"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the event"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                className="input-field"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="input-field pl-10"
                  value={formData.venue}
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                  placeholder="Event venue"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  required
                  className="input-field pl-10"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  placeholder="Maximum attendees"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  required
                  className="input-field pl-10"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Register Till Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  required
                  className="input-field pl-10"
                  value={formData.register_till}
                  onChange={(e) => setFormData({...formData, register_till: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Register Till Time *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="time"
                  required
                  className="input-field pl-10"
                  value={formData.register_till_time}
                  onChange={(e) => setFormData({...formData, register_till_time: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="time"
                  required
                  className="input-field pl-10"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coordinator Name *
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.coordinator}
                onChange={(e) => setFormData({...formData, coordinator: e.target.value})}
                placeholder="Event coordinator"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coordinator Email *
              </label>
              <input
                type="email"
                required
                className="input-field"
                value={formData.coordinator_email}
                onChange={(e) => setFormData({...formData, coordinator_email: e.target.value})}
                placeholder="coordinator@college.edu"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => navigate('/admin')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting ? 'Creating...' : <><Save className="h-4 w-4" /> Create Event</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}