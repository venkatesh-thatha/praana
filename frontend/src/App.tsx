import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import LandingPage from '@/pages/Landing'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'
import OnboardingPage from '@/pages/Onboarding'
import DashboardPage from '@/pages/Dashboard'
import SymptomsPage from '@/pages/Symptoms'
import ScannerPage from '@/pages/Scanner'
import DietPage from '@/pages/Diet'
import VitalsPage from '@/pages/Vitals'
import ExercisePage from '@/pages/Exercise'
import BriefPage from '@/pages/Brief'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to='/login' replace />
}

export default function App() {
  return (
    <Routes>
      <Route path='/' element={<LandingPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/onboarding' element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path='/dashboard' element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path='/symptoms' element={<ProtectedRoute><SymptomsPage /></ProtectedRoute>} />
      <Route path='/scanner' element={<ProtectedRoute><ScannerPage /></ProtectedRoute>} />
      <Route path='/diet' element={<ProtectedRoute><DietPage /></ProtectedRoute>} />
      <Route path='/vitals' element={<ProtectedRoute><VitalsPage /></ProtectedRoute>} />
      <Route path='/exercise' element={<ProtectedRoute><ExercisePage /></ProtectedRoute>} />
      <Route path='/brief' element={<ProtectedRoute><BriefPage /></ProtectedRoute>} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}
