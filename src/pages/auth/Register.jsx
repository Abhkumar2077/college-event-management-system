import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, UserPlus, ShieldCheck } from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roll_number: '',
    department: ''
  })
  const [loading, setLoading] = useState(false)
  const { register, logout } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      roll_number: formData.roll_number.trim(),
      department: formData.department.trim(),
    }

    if (!payload.name || !payload.email || !payload.password || !payload.roll_number || !payload.department) {
      toast.error('Please fill all required fields')
      return
    }

    if (payload.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await register(payload)
      logout()
      toast.success('Account created successfully. Please sign in.')
      navigate('/login')
    } catch {
      toast.error('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_#eff6ff_45%,_#f8fafc_100%)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute -top-20 -right-16 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-5xl grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block">
          <div className="rounded-3xl border border-white/70 bg-white/70 backdrop-blur-xl p-10 shadow-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              <ShieldCheck className="h-4 w-4" />
              Student Access Only
            </div>
            <h1 className="mt-6 text-4xl font-bold text-gray-900 leading-tight">Build your campus event journey.</h1>
            <p className="mt-4 text-gray-600">
              Create your student account to register for events, access personal QR codes,
              and manage attendance history from one place.
            </p>

            <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
              <p className="text-sm uppercase tracking-wide text-blue-100">Quick Start</p>
              <ul className="mt-3 space-y-2 text-sm text-blue-50">
                <li>Create account</li>
                <li>Sign in securely</li>
                <li>Browse and register events</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/85 backdrop-blur-xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
              <Calendar className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-2 text-sm text-gray-600">Join College Event Management</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              id="name"
              type="text"
              required
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            
            <Input
              label="Email Address"
              id="email"
              type="email"
              required
              placeholder="student@college.edu"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />

            <Input
              label="Roll Number"
              id="roll_number"
              type="text"
              required
              placeholder="22CSE123"
              value={formData.roll_number}
              onChange={(e) => setFormData({...formData, roll_number: e.target.value})}
            />

            <Input
              label="Department"
              id="department"
              type="text"
              required
              placeholder="Computer Science"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
            />

            <Input
              label="Password"
              id="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />

            <Button type="submit" variant="primary" className="w-full" disabled={loading} isLoading={loading}>
              {loading ? 'Creating Account...' : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
