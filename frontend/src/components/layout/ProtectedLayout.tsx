import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { Layout } from './Layout'

export function ProtectedLayout() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  return <Layout />
}
