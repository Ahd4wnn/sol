import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Session from './pages/Session';
import NewSession from './pages/NewSession';

import Settings from './pages/Settings';
import Upgrade from './pages/Upgrade';
import UpgradePage from './pages/UpgradePage';
import Admin from './pages/Admin';
import Sessions from './pages/Sessions';
import Memory from './pages/Memory';
import Profile from './pages/Profile';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OnboardingGuard } from './components/auth/OnboardingGuard';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { NetworkStatus } from './components/ui/NetworkStatus';

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <NetworkStatus />
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/auth" element={
              <AuthRoute>
                <Auth />
              </AuthRoute>
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <ErrorBoundary><Dashboard /></ErrorBoundary>
                </OnboardingGuard>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/paywall" element={<Upgrade />} />
            <Route path="/upgrade" element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <UpgradePage />
                </OnboardingGuard>
              </ProtectedRoute>
            } />
            <Route path="/session/new" element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <ErrorBoundary><NewSession /></ErrorBoundary>
                </OnboardingGuard>
              </ProtectedRoute>
            } />
            <Route path="/session/:id" element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <ErrorBoundary><Session /></ErrorBoundary>
                </OnboardingGuard>
              </ProtectedRoute>
            } />
            <Route path="/sessions" element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <ErrorBoundary><Sessions /></ErrorBoundary>
                </OnboardingGuard>
              </ProtectedRoute>
            } />
            <Route path="/memory" element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <ErrorBoundary><Memory /></ErrorBoundary>
                </OnboardingGuard>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <ErrorBoundary><Settings /></ErrorBoundary>
                </OnboardingGuard>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <ErrorBoundary><Profile /></ErrorBoundary>
                </OnboardingGuard>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
