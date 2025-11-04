import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Complaints from './pages/Complaints'
import ReportIssue from './pages/ReportIssue'
import Profile from './pages/Profile'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import AdminDashboard from './pages/AdminDashboard'
import { useAuth } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route index element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<ProtectedRoute><RoleAwareDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

function RoleAwareDashboard() {
  const { user } = useAuth()
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }
  return <Dashboard />
}
