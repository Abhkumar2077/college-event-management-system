import { createContext, useState, useEffect } from 'react'
import api from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    console.log('Initial token check:', token ? 'Token exists' : 'No token')
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      console.log('Fetching user data...')
      const response = await api.get('/auth/me')
      console.log('User data received:', response.data)
      setUser(response.data)
    } catch (error) {
      console.error('Fetch user error:', error.response?.status, error.response?.data)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log('Logging in with:', email)
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response.data
      
      console.log('Login successful')
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      return user
    } catch (error) {
      console.error('Login error:', error.response?.data)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      console.log('Registering user:', userData.email)
      const response = await api.post('/auth/register', userData)
      const { token, user } = response.data
      
      console.log('Registration successful')
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      return user
    } catch (error) {
      console.error('Registration error:', error.response?.data)
      throw error
    }
  }

  const logout = () => {
    console.log('Logging out')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}