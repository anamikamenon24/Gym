import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    // pf_hint is set alongside the httpOnly session cookie; without it there's no session to check.
    if (!document.cookie.split('; ').includes('pf_hint=1')) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { user } = await api('auth/me')
      setUser(user)
      setError(null)
    } catch (e) {
      if (e.status === 401) {
        setUser(null) // session expired — just logged out, not an error
        setError(null)
      } else {
        setError(e)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = async (email, password) => {
    const { user } = await api('auth/login', { method: 'POST', body: { email, password } })
    setUser(user)
    refresh() // picks up streak
    return user
  }

  const signup = async (fields) => {
    const { user } = await api('auth/signup', { method: 'POST', body: fields })
    setUser({ ...user, streak: 0 })
    return user
  }

  const logout = async () => {
    await api('auth/logout', { method: 'POST' })
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user: user && { ...user, name: user.fullName.split(' ')[0], initials: initialsOf(user.fullName) },
      loading,
      error,
      refresh,
      login,
      signup,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, error, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
