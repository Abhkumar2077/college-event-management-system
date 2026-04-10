import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Calendar, LayoutDashboard, Ticket, LogOut, User, Users, BarChart3 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <Calendar className="h-8 w-8 text-primary-600" />
            <span className="font-bold text-xl">CollegeEvents</span>
          </div>
          
          <nav className="space-y-2">
            <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <LayoutDashboard className="h-5 w-5" />
              <span>{user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}</span>
            </Link>
            <Link to="/events" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Ticket className="h-5 w-5" />
              <span>Events</span>
            </Link>
            {user?.role === 'admin' && (
              <>
                <Link to="/admin/create-event" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Calendar className="h-5 w-5" />
                  <span>Create Event</span>
                </Link>
                <Link to="/admin/events" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Calendar className="h-5 w-5" />
                  <span>Manage Events</span>
                </Link>
                <Link to="/admin/registrations" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Users className="h-5 w-5" />
                  <span>Registrations</span>
                </Link>
                <Link to="/admin/reports" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <BarChart3 className="h-5 w-5" />
                  <span>Reports</span>
                </Link>
              </>
            )}
          </nav>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-primary-100 p-2 rounded-full">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="ml-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}