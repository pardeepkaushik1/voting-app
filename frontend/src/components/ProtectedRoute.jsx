import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/useLanguage.js'

function ProtectedRoute({ children, requiredRole }) {
  const { user, isLoading, logout } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 text-slate-600">
        {t('Checking your session...')}
      </main>
    )
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">{t('Access denied')}</h1>
        <p className="mt-2 text-slate-600">
          {t('This page is available to administrators only.')}
        </p>
        <button
          className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          onClick={logout}
          type="button"
        >
          {t('Log out')}
        </button>
      </main>
    )
  }

  return children
}

export default ProtectedRoute