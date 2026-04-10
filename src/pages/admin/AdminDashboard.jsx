import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, Users, Ticket, CheckCircle, Plus, Eye, 
  TrendingUp, Award, PieChart, BarChart3, Download,
  Clock, UserCheck, UserX, Activity, Zap, Star
} from 'lucide-react'
import { 
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts'
import { eventAPI, registrationAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalAttendees: 0,
    totalStudents: 0,
    averageAttendance: 0,
    popularEvent: '',
    popularEventCount: 0,
    completionRate: 0
  })
  
  const [recentEvents, setRecentEvents] = useState([])
  const [attendanceData, setAttendanceData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [topEvents, setTopEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week')

  useEffect(() => {
    loadDashboardData()
  }, [timeRange])

  const loadDashboardData = async () => {
    try {
      // Load data from API
      const eventsRes = await eventAPI.getAll()
      const registrationsRes = await registrationAPI.getAllRegistrations()
      
      const events = eventsRes.data
      const registrations = registrationsRes.data
      
      // Calculate statistics
      const totalEvents = events.length
      const totalRegistrations = registrations.length
      const totalAttendees = registrations.filter(r => r.attendance_status === 'checked_in').length
      
      // Calculate average attendance percentage
      const avgAttendance = totalRegistrations > 0 
        ? ((totalAttendees / totalRegistrations) * 100).toFixed(1) 
        : 0
      
      // Calculate completion rate (events that have happened vs total)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const completedEvents = events.filter(e => new Date(e.date) < today).length
      const completionRate = events.length > 0 ? ((completedEvents / events.length) * 100).toFixed(1) : 0
      
      // Find most popular event
      let popularEvent = { name: 'N/A', count: 0 }
      events.forEach(event => {
        const count = registrations.filter(r => r.event_id === event.id).length
        if (count > popularEvent.count) {
          popularEvent = { name: event.name, count }
        }
      })
      
      // Category distribution for pie chart
      const categories = ['technical', 'cultural', 'seminar', 'sports', 'workshop']
      const categoryStats = categories.map(cat => {
        const catEvents = events.filter(e => e.category === cat)
        const catRegistrations = catEvents.reduce((sum, e) => {
          return sum + registrations.filter(r => r.event_id === e.id).length
        }, 0)
        return {
          name: cat.charAt(0).toUpperCase() + cat.slice(1),
          value: catRegistrations,
          eventCount: catEvents.length,
          color: getCategoryColor(cat)
        }
      }).filter(c => c.value > 0 || c.eventCount > 0)
      
      setCategoryData(categoryStats)
      
      // Top 5 events by registration
      const topEventsList = events.map(event => ({
        name: event.name,
        registrations: registrations.filter(r => r.event_id === event.id).length,
        attendees: registrations.filter(r => r.event_id === event.id && r.attendance_status === 'checked_in').length,
        capacity: event.capacity,
        date: event.date,
        attendanceRate: registrations.filter(r => r.event_id === event.id).length > 0 
          ? ((registrations.filter(r => r.event_id === event.id && r.attendance_status === 'checked_in').length / 
             registrations.filter(r => r.event_id === event.id).length) * 100).toFixed(1)
          : 0
      })).sort((a, b) => b.registrations - a.registrations).slice(0, 5)
      
      setTopEvents(topEventsList)
      
      // Generate trend data based on time range
      const trendDataList = generateTrendData(registrations, timeRange)
      setTrendData(trendDataList)
      
      // Attendance comparison chart
      const attendanceComparison = events.slice(0, 6).map(event => ({
        name: event.name.length > 12 ? event.name.substring(0, 10) + '...' : event.name,
        fullName: event.name,
        registered: registrations.filter(r => r.event_id === event.id).length,
        attended: registrations.filter(r => r.event_id === event.id && r.attendance_status === 'checked_in').length,
        capacity: event.capacity
      }))
      
      setAttendanceData(attendanceComparison)
      
      // Recent events with stats
      const recentEventsList = events.slice(0, 5).map(event => ({
        id: event.id,
        name: event.name,
        registrations: registrations.filter(r => r.event_id === event.id).length,
        attendees: registrations.filter(r => r.event_id === event.id && r.attendance_status === 'checked_in').length,
        date: event.date,
        status: getEventStatus(event.date),
        attendanceRate: registrations.filter(r => r.event_id === event.id).length > 0 
          ? ((registrations.filter(r => r.event_id === event.id && r.attendance_status === 'checked_in').length / 
             registrations.filter(r => r.event_id === event.id).length) * 100).toFixed(1)
          : 0
      }))
      
      setRecentEvents(recentEventsList)
      
      setStats({
        totalEvents,
        totalRegistrations,
        totalAttendees,
        totalStudents: 0,
        averageAttendance: avgAttendance,
        popularEvent: popularEvent.name,
        popularEventCount: popularEvent.count,
        completionRate
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getDateKey = (dateValue) => {
    if (!dateValue) return null
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return null
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const generateTrendData = (registrations, range) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let days = 7
    if (range === 'month') days = 30
    if (range === 'year') days = 365
    
    const data = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = getDateKey(date)
      
      const dayRegistrations = registrations.filter(r => 
        getDateKey(r.registration_date) === dateStr
      ).length
      
      data.push({
        date: dateStr,
        registrations: dayRegistrations,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        formattedDate: range === 'year'
          ? `${date.getMonth() + 1}/${date.getDate()}`
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }
    
    return data
  }

  const getEventStatus = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const eventDate = new Date(date)
    eventDate.setHours(0, 0, 0, 0)
    
    if (eventDate < today) return 'completed'
    if (eventDate.toDateString() === today.toDateString()) return 'today'
    return 'upcoming'
  }

  const getCategoryColor = (category) => {
    const colors = {
      technical: '#3b82f6',
      cultural: '#8b5cf6',
      seminar: '#10b981',
      sports: '#f59e0b',
      workshop: '#ef4444'
    }
    return colors[category] || '#6b7280'
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

  const exportDashboardData = () => {
    const exportData = {
      stats,
      topEvents,
      categoryData,
      recentEvents,
      generatedAt: new Date().toISOString()
    }
    
    const jsonStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard_export_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Dashboard data exported!')
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
      {/* Header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of events, registrations, and analytics</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportDashboardData} className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </button>
          <Link to="/admin/create-event">
            <button className="btn-primary flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Event
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Events</p>
              <p className="text-3xl font-bold mt-1">{stats.totalEvents}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-200" />
          </div>
          <div className="mt-2 text-blue-100 text-xs">+{stats.completionRate}% completion rate</div>
        </div>
        
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Registrations</p>
              <p className="text-3xl font-bold mt-1">{stats.totalRegistrations}</p>
            </div>
            <Ticket className="h-8 w-8 text-green-200" />
          </div>
          <div className="mt-2 text-green-100 text-xs">Across all events</div>
        </div>
        
        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Attendance</p>
              <p className="text-3xl font-bold mt-1">{stats.totalAttendees}</p>
            </div>
            <UserCheck className="h-8 w-8 text-purple-200" />
          </div>
          <div className="mt-2 text-purple-100 text-xs">{stats.averageAttendance}% average rate</div>
        </div>
        
        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Students</p>
              <p className="text-3xl font-bold mt-1">{stats.totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-orange-200" />
          </div>
          <div className="mt-2 text-orange-100 text-xs">Registered users</div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Most Popular Event</p>
              <p className="font-semibold text-gray-900">{stats.popularEvent}</p>
              <p className="text-xs text-gray-500">{stats.popularEventCount} registrations</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Average Attendance Rate</p>
              <p className="font-semibold text-gray-900">{stats.averageAttendance}%</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-green-500 rounded-full h-1.5"
                  style={{ width: `${stats.averageAttendance}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Event Completion</p>
              <p className="font-semibold text-gray-900">{stats.completionRate}%</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-blue-500 rounded-full h-1.5"
                  style={{ width: `${stats.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Registration Trend Chart */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Registration Trend</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 text-xs rounded-lg transition ${timeRange === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Week
              </button>
              <button 
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-xs rounded-lg transition ${timeRange === 'month' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Month
              </button>
              <button 
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1 text-xs rounded-lg transition ${timeRange === 'year' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Year
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedDate" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="registrations" stroke="#3b82f6" fill="#93c5fd" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrations by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No category data available
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance Comparison Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="registered" fill="#3b82f6" name="Registered" />
              <Bar dataKey="attended" fill="#10b981" name="Attended" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Events Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Events</h3>
          <div className="space-y-3">
            {topEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                    <Star className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{event.name}</p>
                    <p className="text-xs text-gray-500">{event.registrations} registrations</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">{event.attendanceRate}%</p>
                  <p className="text-xs text-gray-500">attendance</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Events Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Event Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Registrations</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Attended</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Rate</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentEvents.map(event => (
                <tr key={event.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 font-medium text-gray-900">{event.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{event.date}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{event.registrations}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{event.attendees}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 rounded-full h-1.5"
                          style={{ width: `${event.attendanceRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{event.attendanceRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      event.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                      event.status === 'today' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {event.status === 'completed' ? 'Completed' : 
                       event.status === 'today' ? 'Today' : 'Upcoming'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/admin/attendance/${event.id}`}>
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        View
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}