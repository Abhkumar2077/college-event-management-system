import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import Card from '../../components/common/Card'
import { Users, CheckCircle, Clock } from 'lucide-react'
import { registrationAPI, eventAPI } from '../../services/api'
import toast from 'react-hot-toast'

function AttendanceTracker() {
  const [registrations, setRegistrations] = useState([])
  const [filteredRegistrations, setFilteredRegistrations] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [stats, setStats] = useState({
    totalRegistered: 0,
    totalPresent: 0,
    attendanceRate: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterData()
  }, [searchTerm, selectedEvent, registrations])

  const loadData = async () => {
    try {
      const regsRes = await registrationAPI.getAllRegistrations()
      const eventsRes = await eventAPI.getAll()
      
      setRegistrations(regsRes.data)
      setEvents(eventsRes.data)
      setFilteredRegistrations(regsRes.data)
      
      // Calculate stats
      const totalReg = regsRes.data.length
      const totalCheckedIn = regsRes.data.filter(r => r.attendance_status === 'checked_in').length
      const rate = totalReg > 0 ? ((totalCheckedIn / totalReg) * 100).toFixed(1) : 0
      
      setStats({
        totalRegistered: totalReg,
        totalPresent: totalCheckedIn,
        attendanceRate: rate
      })
    } catch (error) {
      console.error('Error loading attendance data:', error)
      toast.error('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    let filtered = [...registrations]
    
    if (selectedEvent !== 'all') {
      filtered = filtered.filter(r => r.event_id === parseInt(selectedEvent))
    }
    
    if (searchTerm) {
      filtered = filtered.filter(r =>
        (r.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.roll_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.student_email || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredRegistrations(filtered)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Attendance Tracker</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Registered</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRegistered}</p>
            </div>
            <Users className="h-8 w-8 text-primary-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Present</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.totalPresent}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Attendance Rate</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.attendanceRate}%</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, or email..."
              className="input-field pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              className="input-field pl-10 w-full"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Attendees List */}
      <Card className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Student</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Roll Number</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Event</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Check-in Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRegistrations.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  No attendance records found
                </td>
              </tr>
            ) : (
              filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{reg.student_name}</p>
                      <p className="text-xs text-gray-500">{reg.student_email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {reg.roll_number || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {reg.event_name}
                  </td>
                  <td className="py-3 px-4">
                    {reg.attendance_status === 'checked_in' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        ✓ Present
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                        ⏳ Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {reg.check_in_time ? new Date(reg.check_in_time).toLocaleString() : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export default AttendanceTracker
