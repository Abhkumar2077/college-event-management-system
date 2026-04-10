import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QrCode, Calendar, MapPin, Users, Camera, CheckCircle, Clock, Download, Search, Eye } from 'lucide-react'
import QRScannerModal from '../../components/Scanner/QRScanner'
import { eventAPI, registrationAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function EventScanner() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [recentScans, setRecentScans] = useState([])
  const [allAttendees, setAllAttendees] = useState([])
  const [showAllAttendees, setShowAllAttendees] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalRegistered: 0,
    checkedIn: 0,
    pending: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEventData()
  }, [eventId])

  const loadEventData = async () => {
    try {
      // Load event details from API
      const eventResponse = await eventAPI.getById(eventId)
      const currentEvent = eventResponse.data
      setEvent(currentEvent)
      
      // Load all registrations and filter for this event
      const regsResponse = await registrationAPI.getAllRegistrations()
      const eventRegistrations = regsResponse.data.filter(r => r.event_id === parseInt(eventId))
      
      // Get all attendees with details
      const attendeesList = eventRegistrations.map(reg => ({
        id: reg.id,
        userId: reg.user_id,
        studentName: reg.student_name || 'Unknown',
        rollNumber: reg.roll_number || 'N/A',
        email: reg.student_email || 'N/A',
        department: reg.department || 'N/A',
        year: reg.year || 'N/A',
        attendanceStatus: reg.attendance_status,
        checkInTime: reg.check_in_time,
        registrationDate: reg.registration_date
      }))
      
      const checkedInCount = eventRegistrations.filter(r => r.attendance_status === 'checked_in').length
      
      setStats({
        totalRegistered: eventRegistrations.length,
        checkedIn: checkedInCount,
        pending: eventRegistrations.length - checkedInCount
      })
      
      setAllAttendees(attendeesList)
      
      // Load recent scans from localStorage
      const savedScans = JSON.parse(localStorage.getItem(`scans_${eventId}`) || '[]')
      setRecentScans(savedScans.slice(0, 10))
    } catch (error) {
      console.error('Error loading event data:', error)
      toast.error('Event not found')
      navigate('/admin/events')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessfulScan = (scanData) => {
    // Update stats
    setStats(prev => ({
      ...prev,
      checkedIn: prev.checkedIn + 1,
      pending: prev.pending - 1
    }))
    
    // Update attendees list
    setAllAttendees(prev => prev.map(attendee => 
      attendee.userId === scanData.userId 
        ? { ...attendee, attendanceStatus: 'checked_in', checkInTime: new Date().toISOString() }
        : attendee
    ))
    
    // Add to recent scans
    const newScan = {
      ...scanData,
      timestamp: new Date().toISOString(),
      eventId: parseInt(eventId)
    }
    
    const updatedScans = [newScan, ...recentScans].slice(0, 10)
    setRecentScans(updatedScans)
    localStorage.setItem(`scans_${eventId}`, JSON.stringify(updatedScans))
    
    // Update registration in localStorage
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]')
    const updatedRegistrations = registrations.map(r => {
      if (r.userId === scanData.userId && r.eventId === parseInt(eventId)) {
        return {
          ...r,
          attendanceStatus: 'checked_in',
          checkInTime: new Date().toISOString()
        }
      }
      return r
    })
    localStorage.setItem('registrations', JSON.stringify(updatedRegistrations))
  }

  const filteredAttendees = allAttendees.filter(attendee =>
    attendee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const checkedInAttendees = filteredAttendees.filter(a => a.attendanceStatus === 'checked_in')
  const pendingAttendees = filteredAttendees.filter(a => a.attendanceStatus === 'pending')

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Scanner</h1>
          <p className="text-gray-600 mt-1">Scan student QR codes and track attendance</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAllAttendees(!showAllAttendees)} 
            className="btn-secondary flex items-center gap-2"
          >
            <Users className="h-5 w-5" />
            {showAllAttendees ? 'Hide Attendees' : 'View All Attendees'}
          </button>
          <button onClick={() => setShowScanner(true)} className="btn-primary flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Open Scanner
          </button>
        </div>
      </div>

      {/* Event Info Card */}
      {event && (
        <div className="card mb-8 bg-gradient-to-r from-primary-50 to-indigo-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{event.name}</h2>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {event.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {event.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.venue}
                </span>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.totalRegistered}</p>
                <p className="text-xs text-gray-500">Registered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
                <p className="text-xs text-gray-500">Checked In</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 rounded-full h-2 transition-all duration-500"
                style={{ width: `${stats.totalRegistered ? (stats.checkedIn / stats.totalRegistered) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((stats.checkedIn / stats.totalRegistered) * 100)}% Attendance
            </p>
          </div>
        </div>
      )}

      {/* All Attendees Section */}
      {showAllAttendees && (
        <div className="card mb-8">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h3 className="text-lg font-semibold text-gray-900">All Registered Students</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, roll number, or email..."
                className="input-field pl-9 py-1 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => setSearchTerm('')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${!searchTerm ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All ({filteredAttendees.length})
            </button>
            <button
              onClick={() => {/* Filter logic would go here */}}
              className="px-4 py-2 text-sm font-medium text-green-600"
            >
              Checked In ({checkedInAttendees.length})
            </button>
            <button
              onClick={() => {/* Filter logic would go here */}}
              className="px-4 py-2 text-sm font-medium text-yellow-600"
            >
              Pending ({pendingAttendees.length})
            </button>
          </div>
          
          {/* Attendees Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Roll Number</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Check-in Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredAttendees.map(attendee => (
                    <tr key={attendee.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{attendee.studentName}</p>
                          <p className="text-xs text-gray-500">{attendee.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{attendee.rollNumber}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{attendee.department}</p>
                        <p className="text-xs text-gray-500">Year {attendee.year}</p>
                      </td>
                      <td className="py-3 px-4">
                        {attendee.attendanceStatus === 'checked_in' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3" />
                            Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                            <Clock className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">
                          {attendee.checkInTime ? new Date(attendee.checkInTime).toLocaleTimeString() : '-'}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Scans */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Check-ins</h3>
        {recentScans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No scans yet. Start scanning QR codes!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentScans.map((scan, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{scan.name}</p>
                    <p className="text-xs text-gray-500">Roll: {scan.rollNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-700 font-medium">Checked In</p>
                  <p className="text-xs text-gray-500">
                    {new Date(scan.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scanner Modal */}
      {showScanner && event && (
        <QRScannerModal
          eventId={eventId}
          eventName={event.name}
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleSuccessfulScan}
        />
      )}
    </div>
  )
}