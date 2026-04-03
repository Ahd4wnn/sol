import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Never redirect while loading — wait for auth to resolve
  if (loading) return null

  if (!user) {
    return (
      <Navigate
        to="/auth"
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  return children
}
