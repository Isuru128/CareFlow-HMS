import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/auth/LoginPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import UserManagementPage from '../pages/users/UserManagementPage'
import UserProfilePage from '../pages/users/UserProfilePage'
import ProtectedRoute from './ProtectedRoute'
import MainLayout from '../components/layout/MainLayout'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes for Authenticated Users */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<UserProfilePage />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute requiredRole="ROLE_ADMIN" />}>
            <Route path="/users" element={<UserManagementPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
