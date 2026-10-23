import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../features/auth/api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load active session from localStorage on startup
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (usernameOrEmail, password) => {
    const data = await authApi.login({ usernameOrEmail, password })

    const userData = {
      id: data.id,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      roles: data.roles || []
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))

    setToken(data.token)
    setUser(userData)
    return userData
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch (err) {
      console.error('Logout error on backend:', err)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
    }
  }

  const hasRole = (role) => {
    if (!user || !user.roles) return false
    const normalized = role.startsWith('ROLE_') ? role : `ROLE_${role}`
    return user.roles.includes(normalized)
  }

  const isAdmin = hasRole('ROLE_ADMIN')

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin,
        hasRole,
        login,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
