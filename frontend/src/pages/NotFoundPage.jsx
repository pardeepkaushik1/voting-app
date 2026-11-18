import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/useLanguage.js'

function NotFoundPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const homePath =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'voter'
        ? '/candidates'
        : '/login'

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-12">
      <section className="auth-card w-full max-w-lg p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
          Error 404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          {t('Page not found')}
        </h1>
        <p className="mt-3 text-slate-600">
          {t('The page you are looking for does not exist or may have moved.')}
        </p>
        <Link
          className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
          to={homePath}
        >
          {t(user ? 'Go to your home page' : 'Go to sign in')}
        </Link>
      </section>
    </main>
  )
}

export default NotFoundPage