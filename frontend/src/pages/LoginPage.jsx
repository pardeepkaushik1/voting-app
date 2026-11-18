import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/useLanguage.js'

function getRoleHome(role) {
  return role === 'admin' ? '/admin' : '/candidates'
}

function LoginPage() {
  const { user, authError, login } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [aadharCardNumber, setAadharCardNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    const requestedPath = location.state?.from?.pathname
    const roleHome = getRoleHome(user.role)
    const allowedPath = user.role === 'admin'
      ? requestedPath?.startsWith('/admin')
      : requestedPath === '/candidates' || requestedPath?.startsWith('/profile')

    return <Navigate replace to={allowedPath ? requestedPath : roleHome} />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login({
        aadharCardNumber: aadharCardNumber.trim(),
        password,
      })
    } catch (loginError) {
      setError(t(loginError.message || 'Could not log in.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page auth-layout">
      <aside className="auth-showcase">
        <div className="auth-showcase-copy">
          <span className="auth-eyebrow">{t('YOUR VOICE. YOUR VOTE.')}</span>
          <h2>{t('Make your choice count.')}</h2>
          <p>
            {t('A simple, secure place to take part in the election and follow the candidates.')}
          </p>
        </div>
        <div aria-hidden="true" className="ballot-illustration">
          <div className="ballot-topline">
            <span />
            <span />
            <span />
          </div>
          <div className="ballot-title-line" />
          <div className="ballot-option">
            <i />
            <span />
          </div>
          <div className="ballot-option">
            <i />
            <span />
          </div>
          <div className="ballot-option selected">
            <i>✓</i>
            <span />
          </div>
          <div className="ballot-submit">{t('Your vote matters')}</div>
        </div>
        <span aria-hidden="true" className="auth-orbit auth-orbit-one" />
        <span aria-hidden="true" className="auth-orbit auth-orbit-two" />
      </aside>

      <section className="auth-card auth-form-card">
        <div className="auth-form-heading">
          <span aria-hidden="true" className="auth-form-icon">↗</span>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            {t('Voting application')}
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{t('Welcome back')}</h1>
        <p className="mt-2 text-slate-600">
          {t('Sign in with your Aadhar card number and password.')}
        </p>

        {location.state?.message && (
          <p
            aria-live="polite"
            className="status-message mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
            role="status"
          >
            {location.state.message}
          </p>
        )}

        {(error || authError) && (
          <p
            aria-live="polite"
            className="status-message mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {t(error || authError)}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              {t('Aadhar card number')}
            </span>
            <input
              autoComplete="off"
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              inputMode="numeric"
              maxLength={12}
              minLength={12}
              onChange={(event) => setAadharCardNumber(event.target.value)}
              pattern="[0-9]{12}"
              required
              value={aadharCardNumber}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('Password')}</span>
            <div className="relative">
              <input
                autoComplete=""
                className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={t(showPassword ? 'Hide password' : 'Show password')}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-3 text-sm font-medium text-indigo-700 hover:underline"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {t(showPassword ? 'Hide' : 'Show')}
              </button>
            </div>
          </label>

          <div className="-mt-2 text-right">
            <Link
              className="text-sm font-semibold text-indigo-700 hover:underline"
              to="/forgot-password"
            >
              {t('Forgot password?')}
            </Link>
          </div>

          <button
            className="app-primary-button w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t('Signing in...') : t('Sign in')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {t("Don't have an account?")}{' '}
          <Link className="font-semibold text-indigo-700 hover:underline" to="/signup">
            {t('Create one')}
          </Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
