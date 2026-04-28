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
import LabReportPage from '@/pages/LabReport'
import ConsultPage from '@/pages/Consult'
import SkinPage from '@/pages/Skin'
import XRayPage from '@/pages/XRay'
import TriagePage from '@/pages/Triage'
import ProfilePage from '@/pages/Profile'
import HerbsPage from '@/pages/Herbs'

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
      <Route path='/lab-report' element={<ProtectedRoute><LabReportPage /></ProtectedRoute>} />
      <Route path='/consult' element={<ProtectedRoute><ConsultPage /></ProtectedRoute>} />
      <Route path='/skin' element={<ProtectedRoute><SkinPage /></ProtectedRoute>} />
      <Route path='/xray' element={<ProtectedRoute><XRayPage /></ProtectedRoute>} />
      <Route path='/triage' element={<ProtectedRoute><TriagePage /></ProtectedRoute>} />
      <Route path='/profile' element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path='/herbs' element={<ProtectedRoute><HerbsPage /></ProtectedRoute>} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}
