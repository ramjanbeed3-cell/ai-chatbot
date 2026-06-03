import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// ✅ DEMO MODE — works without any backend/PHP
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const handleLogin = async (email, password) => {
    setLoading(true); setError(null)
    await new Promise(r => setTimeout(r, 800)) // simulate API delay
    // Accept demo credentials OR any email+password (demo mode)
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return false
    }
    const user = { id: 1, name: email.split('@')[0].replace(/\./g,' ').replace(/\b\w/g,l=>l.toUpperCase()), email }
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    setLoading(false)
    return true
  }

  const handleRegister = async (name, email, password, passwordConfirmation) => {
    setLoading(true); setError(null)
    await new Promise(r => setTimeout(r, 800))
    if (password !== passwordConfirmation) { setError('Passwords do not match'); setLoading(false); return false }
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return false }
    const user = { id: 1, name, email }
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    setLoading(false)
    return true
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, handleLogin, handleRegister, handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
