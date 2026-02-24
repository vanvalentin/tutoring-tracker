import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { isSupabaseConfigured } from './lib/supabase'

const theme = createTheme({
  palette: {
    primary: { main: '#0d9488' },
  },
})
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SetupRequiredPage from './pages/SetupRequiredPage'
import HomePage from './pages/HomePage'
import LessonsPage from './pages/LessonsPage'
import TransportationPage from './pages/TransportationPage'
import MaterialPage from './pages/MaterialPage'
import StatsPage from './pages/StatsPage'
import FeesPage from './pages/FeesPage'
import StudentsPage from './pages/StudentsPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/lessons" element={<LessonsPage />} />
                <Route path="/transportation" element={<TransportationPage />} />
                <Route path="/material" element={<MaterialPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/fees" element={<FeesPage />} />
                <Route path="/students" element={<StudentsPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  if (!isSupabaseConfigured()) {
    return <SetupRequiredPage />
  }

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  )
}
