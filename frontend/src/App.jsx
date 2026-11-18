import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import ChatbotWidget from './components/ChatbotWidget.jsx'
import LanguageSwitcher from './components/LanguageSwitcher.jsx'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminCandidatesPage from './pages/AdminCandidatesPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import CandidatesPage from './pages/CandidatesPage.jsx'
import ComplaintsPage from './pages/ComplaintsPage.jsx'
import AdminComplaintsPage from './pages/AdminComplaintsPage.jsx'
import ChangePasswordPage from './pages/ChangePasswordPage.jsx'
import EmailVerificationPage from './pages/EmailVerificationPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import VotingHistoryPage from './pages/VotingHistoryPage.jsx'

function RoleLayout({ requiredRole }) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <Navbar />
      <Outlet />
      <ChatbotWidget />
    </ProtectedRoute>
  )
}

function App() {
  return (
    <>
    <LanguageSwitcher />
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route
        element={<SignupPage />}
        path="/signup"
      />
      <Route element={<EmailVerificationPage />} path="/verify-email" />
      <Route element={<ForgotPasswordPage />} path="/forgot-password" />
      <Route element={<ResetPasswordPage />} path="/reset-password" />
      <Route element={<RoleLayout requiredRole="admin" />}>
        <Route element={<AdminDashboardPage />} path="/admin" />
        <Route element={<AdminDashboardPage />} path="/admin/elections/new" />
        <Route element={<AdminDashboardPage />} path="/admin/users" />
        <Route element={<AdminCandidatesPage />} path="/admin/candidates" />
        <Route element={<AdminComplaintsPage />} path="/admin/complaints" />
      </Route>
      <Route element={<RoleLayout requiredRole="voter" />}>
        <Route element={<CandidatesPage />} path="/candidates" />
        <Route element={<VotingHistoryPage />} path="/voting-history" />
        <Route element={<ComplaintsPage />} path="/complaints" />
      </Route>
      <Route element={<RoleLayout />}>
        <Route element={<ProfilePage />} path="/profile" />
        <Route element={<ChangePasswordPage />} path="/change-password" />
      </Route>
      <Route
        element={<Navigate replace to="/login" />}
        path="/"
      />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
    </>
  )
}

export default App
