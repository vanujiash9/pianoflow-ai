import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { ApiError, api } from '../lib/api'

export interface AuthUser {
  id: string
  username: string
  role: string
  is_active: boolean
  last_login_at: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  error: string
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api<{ user: AuthUser }>('/auth/me')
      setUser(response.user)
    } catch (err) {
      setUser(null)
      if (err instanceof ApiError && err.status === 401) return
      setError(err instanceof Error ? err.message : 'Không thể tải phiên đăng nhập.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const login = async (username: string, password: string) => {
    const response = await api<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    setUser(response.user)
  }

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, error, login, logout, refresh }),
    [user, loading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
