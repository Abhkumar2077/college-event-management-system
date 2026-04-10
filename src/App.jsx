import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import StudentDashboard from './pages/student/StudentDashboard'
import EventListing from './pages/events/EventListing'
import EventDetail from './pages/events/EventDetail'
import MyQRCode from './pages/student/MyQRCode'
import AdminDashboard from './pages/admin/AdminDashboard'
import CreateEvent from './pages/admin/CreateEvent'
import ManageEvents from './pages/admin/ManageEvents'
import EditEvent from './pages/admin/EditEvent'
import ManageRegistrations from './pages/admin/ManageRegistrations'
import EventScanner from './pages/admin/EventScanner'
import AttendanceReports from './pages/admin/AttendanceReports'
import Layout from './components/Layout/Layout'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={
          !user ? <Navigate to="/login" /> :
          user.role === 'admin' ? <Navigate to="/admin" /> :
          <Navigate to="/dashboard" />
        } />
        
        {/* Student Routes */}
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/events" element={<EventListing />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/my-qr/:eventId" element={<MyQRCode />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/create-event" element={<CreateEvent />} />
        <Route path="/admin/events" element={<ManageEvents />} />
        <Route path="/admin/edit-event/:id" element={<EditEvent />} />
        <Route path="/admin/registrations" element={<ManageRegistrations />} />
        <Route path="/admin/scanner/:eventId" element={<EventScanner />} />
        <Route path="/admin/reports" element={<AttendanceReports />} />
      </Route>
    </Routes>
  )
}

export default App