import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { resetPassword } from '../services/authService.js'
import { useLanguage } from '../context/useLanguage.js'

function ResetPasswordPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [aadharCardNumber, setAadharCardNumber] = useState(
    state?.aadharCardNumber || '',
  )
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError(t('New password and confirmation do not match.'))
      return
    }

    setIsSubmitting(true)

    try {
      await resetPassword({
        aadharCardNumber: aadharCardNumber.trim(),
        otp,
        newPassword,
      })
      navigate('/login', {
        replace: true,
        state: { message: t('Password reset successfully. Sign in with your new password.') },
      })
    } catch (requestError) {
      setError(t(requestError.message || 'Could not reset your password.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-12">
      <section className="auth-card auth-form-card">
        <div className="auth-form-heading">
          <span aria-hidden="true" className="auth-form-icon">↻</span>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            {t('Account recovery')}
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          {t('Reset your password')}
        </h1>
        <p className="mt-2 text-slate-600">
          {t('Enter the Aadhaar number and six-digit code used for your reset request, then choose a new password.')}
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
            <span className="text-sm font-medium text-slate-700">
              {t('Aadhaar number')}
            </span>
            <input
              autoComplete="off"
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              inputMode="numeric"
              maxLength={12}
              minLength={12}
              onChange={(event) =>
                setAadharCardNumber(
                  event.target.value.replace(/\D/g, '').slice(0, 12),
                )
              }
              pattern="[0-9]{12}"
              required
              value={aadharCardNumber}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              {t('Reset code')}
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

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              {t('New password')}
            </span>
            <input
              autoComplete="new-password"
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              {t('Confirm new password')}
            </span>
            <input
              autoComplete="new-password"
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </label>

          <button
            className="app-primary-button w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t('Resetting...') : t('Reset password')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {t('Need another code?')}{' '}
          <Link
            className="font-semibold text-indigo-700 hover:underline"
            to="/forgot-password"
            state={{ aadharCardNumber }}
          >
            {t('Request a new one')}
          </Link>
        </p>
      </section>
    </main>
  )
}

export default ResetPasswordPage
