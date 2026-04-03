import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function OnboardingGuard({ children }) {
  const { user, profile, loading } = useAuth()

  // Wait for both auth and profile to load
  if (loading || (user && profile === null)) return null

  // If profile loaded and onboarding not done → redirect
  if (user && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
