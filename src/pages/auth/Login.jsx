import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Mail, Lock, LogIn, Shield, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const email = formData.email.trim().toLowerCase()
    const password = formData.password

    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }

    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome ${user.name}!`)
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      if (!error?.response) {
        toast.error('Cannot reach server. Please start backend on port 5000 and try again.')
      } else {
        toast.error(error?.response?.data?.message || 'Login failed. Check your credentials and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_#dbeafe_0%,_#eff6ff_40%,_#f8fafc_100%)] py-12 px-4">
      <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
            <Calendar className="h-10 w-10 text-primary-600" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in to your College Events account</p>
        </div>
        
        <div className="rounded-3xl border border-white/70 bg-white/85 backdrop-blur-xl p-8 shadow-xl">
          {/* Demo Credentials Alert */}
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Demo Credentials
                </p>
                <div className="text-xs text-blue-700 mt-1 space-y-1">
                  <p><span className="font-mono">student@college.edu</span> / <span className="font-mono">student123</span> (Student)</p>
                  <p><span className="font-mono">admin@college.edu</span> / <span className="font-mono">admin123</span> (Admin)</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  className="input-field pl-10"
                  placeholder="student@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  className="input-field pl-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? 'Signing in...' : <><LogIn className="h-4 w-4" /> Sign In</>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}