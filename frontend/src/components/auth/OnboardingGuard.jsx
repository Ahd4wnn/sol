import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function OnboardingGuard({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) return null

  if (user && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
