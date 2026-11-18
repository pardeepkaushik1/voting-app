import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/useLanguage.js'

function EmailVerificationPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { verifyEmail } = useAuth()
  const { t } = useLanguage()
  const [email, setEmail] = useState(state?.email || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await verifyEmail({ email: email.trim(), otp })
      navigate('/candidates', { replace: true })
    } catch (requestError) {
      setError(t(requestError.message || 'Could not verify your email.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-12">
      <section className="auth-card auth-form-card">
        <div className="auth-form-heading">
          <span aria-hidden="true" className="auth-form-icon">✉</span>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            {t('Account verification')}
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          {t('Verify your email')}
        </h1>
        <p className="mt-2 text-slate-600">
          {t('Enter the six-digit code sent to your email address. The code is valid for five minutes.')}
        </p>

        {error && (
          <p
            aria-live="polite"
            className="status-message mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('Email')}</span>
            <input
              autoComplete="email"
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              {t('Verification code')}
            </span>
            <input
              autoComplete="one-time-code"
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              inputMode="numeric"
              maxLength={6}
              minLength={6}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              pattern="[0-9]{6}"
              required
              value={otp}
            />
          </label>

          <button
            className="app-primary-button w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t('Verifying...') : t('Verify email')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {t('Need to start again?')}{' '}
          <Link className="font-semibold text-indigo-700 hover:underline" to="/signup">
            {t('Create an account')}
          </Link>
        </p>
      </section>
    </main>
  )
}

export default EmailVerificationPage
