import axios from 'axios'
import toast from 'react-hot-toast'

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

let isHandlingUnauthorized = false

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const requestUrl = error.config?.url || ''
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register')

    if (status === 401 && !isAuthEndpoint && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      const isLoginPage = window.location.pathname === '/login'
      if (!isLoginPage) {
        toast.error('Session expired. Please login again.')
        window.location.href = '/login'
      }

      setTimeout(() => {
        isHandlingUnauthorized = false
      }, 500)
    }
    return Promise.reject(error)
  }
)

// Registration API calls
export const registrationAPI = {
  checkRegistration: (eventId) => api.get(`/registrations/check/${eventId}`),
  register: (eventId) => api.post(`/registrations/${eventId}`),
  getMyRegistrations: () => api.get('/registrations/my'),
  getAllRegistrations: () => api.get('/registrations/all'), // Added this for admin
  cancelRegistration: (registrationId) => api.delete(`/registrations/${registrationId}`),
  approveRegistration: (registrationId) => api.post(`/registrations/${registrationId}/approve`)
}

// Event API calls
export const eventAPI = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`)
}

// Attendance API calls
export const attendanceAPI = {
  scanQR: (data) => api.post('/attendance/scan', data),
  getEventAttendance: (eventId) => api.get(`/attendance/${eventId}`)
}

export default api