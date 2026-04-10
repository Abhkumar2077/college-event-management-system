import { useState, useEffect } from 'react'
import { Users, Search, Filter, Download, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react'
import { registrationAPI, eventAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function ManageRegistrations() {
  const [registrations, setRegistrations] = useState([])
  const [filteredRegistrations, setFilteredRegistrations] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load events
      const eventsResponse = await eventAPI.getAll()
      setEvents(eventsResponse.data)
      
      // Load all registrations (admin view)
      const registrationsResponse = await registrationAPI.getAllRegistrations()
      setRegistrations(registrationsResponse.data)
      setFilteredRegistrations(registrationsResponse.data)
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    filterRegistrations()
  }, [searchTerm, selectedEvent, selectedStatus, registrations])

  const filterRegistrations = () => {
    let filtered = [...registrations]
    
    if (selectedEvent !== 'all') {
      filtered = filtered.filter(r => r.event_id === parseInt(selectedEvent))
    }
    
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'approved') {
        filtered = filtered.filter(r => r.approval_status === 'approved')
      } else if (selectedStatus === 'unapproved') {
        filtered = filtered.filter(r => r.approval_status !== 'approved')
      } else if (selectedStatus === 'checked_in') {
        filtered = filtered.filter(r => r.attendance_status === 'checked_in')
      } else if (selectedStatus === 'pending_checkin') {
        filtered = filtered.filter(r => r.attendance_status !== 'checked_in')
      }
    }
    
    if (searchTerm) {
      filtered = filtered.filter(r =>
        (r.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.student_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.roll_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.event_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredRegistrations(filtered)
  }

  const handleDeleteRegistration = async () => {
    if (selectedRegistration) {
      try {
        await registrationAPI.cancelRegistration(selectedRegistration.id)
        toast.success('Registration cancelled successfully!')
        loadData() // Reload data
        setShowDeleteModal(false)
        setSelectedRegistration(null)
      } catch (error) {
        console.error('Delete error:', error)
        toast.error('Failed to cancel registration')
      }
    }
  }

  const handleApproveRegistration = async () => {
    if (selectedRegistration) {
      try {
        await registrationAPI.approveRegistration(selectedRegistration.id)
        toast.success('Registration approved successfully!')
        loadData() // Reload data
        setShowApprovalModal(false)
        setSelectedRegistration(null)
      } catch (error) {
        console.error('Approve error:', error)
        toast.error('Failed to approve registration')
      }
    }
  }

  const exportToCSV = () => {
    const headers = ['Student Name', 'Roll Number', 'Email', 'Event Name', 'Registration Date', 'Attendance Status', 'Check-in Time']
    const csvData = filteredRegistrations.map(r => [
      r.student_name || 'N/A',
      r.roll_number || 'N/A',
      r.student_email || 'N/A',
      r.event_name,
      new Date(r.registration_date).toLocaleString(),
      r.attendance_status === 'checked_in' ? 'Present' : 'Pending',
      r.check_in_time ? new Date(r.check_in_time).toLocaleString() : '-'
    ])
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported successfully!')
  }

  const getStatusBadge = (status) => {
    if (status === 'checked_in') {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">✓ Checked In</span>
    }
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">⏳ Pending</span>
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
          <h1 className="text-3xl font-bold text-gray-900">Student Registrations</h1>
          <p className="text-gray-600 mt-1">View and manage all event registrations</p>
        </div>
        <button onClick={exportToCSV} className="btn-primary flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Registrations</p>
              <p className="text-3xl font-bold text-gray-900">{registrations.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-600">{registrations.filter(r => r.approval_status === 'approved').length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Awaiting Approval</p>
              <p className="text-3xl font-bold text-yellow-600">{registrations.filter(r => r.approval_status !== 'approved').length}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <XCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Checked In</p>
              <p className="text-3xl font-bold text-indigo-600">{registrations.filter(r => r.attendance_status === 'checked_in').length}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or roll number..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              className="input-field pl-10"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              className="input-field pl-10"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="approved">✓ Approved</option>
              <option value="unapproved">⏳ Awaiting Approval</option>
              <option value="checked_in">✓ Checked In</option>
              <option value="pending_checkin">⏳ Pending Check-in</option>
            </select>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Student</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Event</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Registration Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Approval</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Check-in Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRegistrations.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No registrations found
                </td>
              </tr>
            ) : (
              filteredRegistrations.map(reg => (
                <tr key={reg.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{reg.student_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{reg.student_email}</p>
                      <p className="text-xs text-gray-500">Roll: {reg.roll_number || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-900">{reg.event_name}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">
                      {new Date(reg.registration_date).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full">
                        {reg.approval_status === 'approved' ? (
                          <span className="bg-green-100 text-green-700">✓ Approved</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700">⏳ Pending</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(reg.attendance_status)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {reg.approval_status !== 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedRegistration(reg)
                            setShowApprovalModal(true)
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                          title="Approve Registration"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedRegistration(reg)
                          setShowDeleteModal(true)
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                        title="Cancel Registration"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Approval Confirmation Modal */}
      {showApprovalModal && selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Approve Registration</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to approve registration for "<span className="font-semibold">{selectedRegistration.student_name}</span>" 
              for event "<span className="font-semibold">{selectedRegistration.event_name}</span>"?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowApprovalModal(false)
                  setSelectedRegistration(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveRegistration}
                className="btn-primary"
              >
                Approve Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Cancel Registration</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel registration for "<span className="font-semibold">{selectedRegistration.student_name}</span>" 
              for event "<span className="font-semibold">{selectedRegistration.event_name}</span>"?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedRegistration(null)
                }}
                className="btn-secondary"
              >
                Keep Registration
              </button>
              <button
                onClick={handleDeleteRegistration}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Cancel Registration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}