import { useState, useEffect } from 'react'
import { Download, FileText, Calendar, Users, CheckCircle, Clock, Filter, Printer, BarChart3, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { eventAPI, registrationAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function AttendanceReports() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('full')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedEvent !== 'all') {
      generateReport()
    } else {
      generateFullReport()
    }
  }, [selectedEvent, reportType])

  const loadData = async () => {
    try {
      const eventsRes = await eventAPI.getAll()
      setEvents(eventsRes.data)
      await generateFullReport(eventsRes.data)
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const generateFullReport = async () => {
    try {
      const regsRes = await registrationAPI.getAllRegistrations()
      const registrations = regsRes.data
      
      const report = registrations.map(reg => ({
        id: reg.id,
        eventId: reg.event_id,
        studentName: reg.student_name,
        rollNumber: reg.roll_number,
        email: reg.student_email,
        department: reg.department,
        year: reg.year,
        eventName: reg.event_name || 'Unknown Event',
        eventDate: reg.event_date || 'N/A',
        registrationDate: new Date(reg.registration_date).toLocaleString(),
        attendanceStatus: reg.attendance_status,
        checkInTime: reg.check_in_time ? new Date(reg.check_in_time).toLocaleString() : 'Not checked in'
      }))
      
      setReportData(report)
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    }
  }

  const generateReport = async () => {
    try {
      const regsRes = await registrationAPI.getAllRegistrations()
      const registrations = regsRes.data
      const event = events.find(e => e.id === parseInt(selectedEvent))
      
      let filteredRegistrations = registrations.filter(r => r.event_id === parseInt(selectedEvent))
      
      if (reportType === 'present') {
        filteredRegistrations = filteredRegistrations.filter(r => r.attendance_status === 'checked_in')
      } else if (reportType === 'absent') {
        filteredRegistrations = filteredRegistrations.filter(r => r.attendance_status !== 'checked_in')
      }
      
      const report = filteredRegistrations.map(reg => ({
        id: reg.id,
        eventId: reg.event_id,
        studentName: reg.student_name,
        rollNumber: reg.roll_number,
        email: reg.student_email,
        department: reg.department,
        year: reg.year,
        eventName: event?.name || 'Unknown Event',
        eventDate: event?.date || 'N/A',
        registrationDate: new Date(reg.registration_date).toLocaleString(),
        attendanceStatus: reg.attendance_status,
        checkInTime: reg.check_in_time ? new Date(reg.check_in_time).toLocaleString() : 'Not checked in'
      }))
      
      setReportData(report)
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    }
  }

  const exportToCSV = () => {
    const headers = ['Student Name', 'Roll Number', 'Email', 'Department', 'Year', 'Event Name', 'Event Date', 'Registration Date', 'Attendance Status', 'Check-in Time']
    const csvData = reportData.map(r => [
      r.studentName,
      r.rollNumber,
      r.email,
      r.department,
      r.year,
      r.eventName,
      r.eventDate,
      r.registrationDate,
      r.attendanceStatus === 'checked_in' ? 'Present' : 'Absent',
      r.checkInTime
    ])
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_report_${selectedEvent === 'all' ? 'all_events' : events.find(e => e.id === parseInt(selectedEvent))?.name}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported successfully!')
  }

  const exportToJSON = () => {
    const jsonStr = JSON.stringify(reportData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('JSON report exported!')
  }

  const printReport = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #3b82f6; color: white; }
            .header { margin-bottom: 20px; }
            .stats { margin: 20px 0; padding: 10px; background-color: #f3f4f6; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Attendance Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Event: ${selectedEvent === 'all' ? 'All Events' : events.find(e => e.id === parseInt(selectedEvent))?.name}</p>
            <p>Report Type: ${reportType === 'full' ? 'Full Report' : reportType === 'present' ? 'Present Only' : 'Absent Only'}</p>
          </div>
          <div class="stats">
            <strong>Statistics:</strong><br/>
            Total Students: ${reportData.length}<br/>
            Present: ${reportData.filter(r => r.attendanceStatus === 'checked_in').length}<br/>
            Absent: ${reportData.filter(r => r.attendanceStatus !== 'checked_in').length}
          </div>
          <table>
            <thead>
              <tr><th>Student Name</th><th>Roll Number</th><th>Email</th><th>Department</th><th>Status</th><th>Check-in Time</th></tr>
            </thead>
            <tbody>
              ${reportData.map(r => `
                <tr>
                  <td>${r.studentName}</td>
                  <td>${r.rollNumber}</td>
                  <td>${r.email}</td>
                  <td>${r.department}</td>
                  <td>${r.attendanceStatus === 'checked_in' ? 'Present' : 'Absent'}</td>
                  <td>${r.checkInTime}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const stats = {
    total: reportData.length,
    present: reportData.filter(r => r.attendanceStatus === 'checked_in').length,
    absent: reportData.filter(r => r.attendanceStatus !== 'checked_in').length,
    attendanceRate: reportData.length ? ((reportData.filter(r => r.attendanceStatus === 'checked_in').length / reportData.length) * 100).toFixed(2) : 0
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Reports Dashboard</h1>
            <p className="text-gray-600 mt-1">Track attendance and export insights.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={exportToCSV} className="btn-primary flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export CSV
            </button>
            <button onClick={exportToJSON} className="btn-secondary flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Export JSON
            </button>
            <button onClick={printReport} className="btn-secondary flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print
            </button>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-blue-700 border border-blue-100">
          <TrendingUp className="h-4 w-4" />
          Live analytics based on current registrations and check-ins
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                className="input-field pl-10"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="full">Full Report (All Students)</option>
                <option value="present">Present Only</option>
                <option value="absent">Absent Only</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-end">
            <div className="bg-blue-50 rounded-lg p-3 w-full">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Total Records:</span> {stats.total}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Present</p>
              <p className="text-3xl font-bold text-green-600">{stats.present}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Absent</p>
              <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Attendance Rate</p>
              <p className="text-3xl font-bold text-primary-600">{stats.attendanceRate}%</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Attendance Split</h3>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Present', value: stats.present, color: '#16a34a' },
                    { name: 'Absent', value: stats.absent, color: '#dc2626' }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={88}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#16a34a" />
                  <Cell fill="#dc2626" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Events Performance</h3>
            <Calendar className="h-5 w-5 text-gray-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={events
                  .map((event) => {
                    const eventRegs = reportData.filter((r) => r.eventId === event.id)
                    const present = eventRegs.filter((r) => r.attendanceStatus === 'checked_in').length
                    return {
                      name: event.name.length > 14 ? `${event.name.slice(0, 14)}...` : event.name,
                      registered: eventRegs.length,
                      present,
                      absent: eventRegs.length - present
                    }
                  })
                  .sort((a, b) => b.registered - a.registered)
                  .slice(0, 6)
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="present" stackId="attendance" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" stackId="attendance" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Department Participation</h3>
            <Users className="h-5 w-5 text-gray-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reportData
                  .reduce((acc, current) => {
                    const key = current.department || 'Unknown'
                    const existing = acc.find((item) => item.department === key)
                    if (existing) {
                      existing.students += 1
                    } else {
                      acc.push({ department: key, students: 1 })
                    }
                    return acc
                  }, [])
                  .sort((a, b) => b.students - a.students)
                  .slice(0, 5)
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="students" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Student Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Roll Number</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Department</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Event</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Check-in Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reportData.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No data found for selected filters
                </td>
              </tr>
            ) : (
              reportData.map(record => (
                <tr key={record.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{record.studentName}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{record.rollNumber}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{record.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{record.department}</p>
                    <p className="text-xs text-gray-500">Year {record.year}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-900">{record.eventName}</p>
                    <p className="text-xs text-gray-500">{record.eventDate}</p>
                  </td>
                  <td className="py-3 px-4">
                    {record.attendanceStatus === 'checked_in' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        <Clock className="h-3 w-3" />
                        Absent
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{record.checkInTime}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}