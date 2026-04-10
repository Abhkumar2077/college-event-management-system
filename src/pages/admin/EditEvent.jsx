import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Clock, Save, X } from 'lucide-react'
import { eventAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function EditEvent() {
  const { id } = useParams()
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
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadEvent()
  }, [id])

  const loadEvent = async () => {
    try {
      const response = await eventAPI.getById(id)
      const event = response.data
      setFormData({
        name: event.name,
        description: event.description,
        category: event.category,
        venue: event.venue,
        capacity: event.capacity,
        date: event.date,
        register_till: event.register_till || event.date,
        register_till_time: event.register_till_time || '23:59',
        time: event.time,
        coordinator: event.coordinator || '',
        coordinator_email: event.coordinator_email || ''
      })
    } catch (error) {
      console.error('Error loading event:', error)
      toast.error('Event not found')
      navigate('/admin/events')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      await eventAPI.update(id, {
        ...formData,
        capacity: parseInt(formData.capacity)
      })
      toast.success('Event updated successfully!')
      navigate('/admin/events')
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update event')
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-600 mt-1">Update event details</p>
        </div>
        <button onClick={() => navigate('/admin/events')} className="btn-secondary flex items-center gap-2">
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
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => navigate('/admin/events')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting ? 'Saving...' : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}