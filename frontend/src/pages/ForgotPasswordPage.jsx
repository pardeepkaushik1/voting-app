import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { requestPasswordReset } from '../services/authService.js'
import { useLanguage } from '../context/useLanguage.js'

function ForgotPasswordPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [aadharCardNumber, setAadharCardNumber] = useState(
    state?.aadharCardNumber || '',
  )
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      const response = await requestPasswordReset({
        aadharCardNumber: aadharCardNumber.trim(),
      })
      setMessage(t(response?.message || 'If an eligible account exists, a reset code will be sent to its registered email.'))
    } catch (requestError) {
      setError(t(requestError.message || 'Could not request a password reset.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function continueToReset() {
    navigate('/reset-password', {
      state: { aadharCardNumber: aadharCardNumber.trim() },
    })
  }

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-12">
      <section className="auth-card auth-form-card">
        <div className="auth-form-heading">
          <span aria-hidden="true" className="auth-form-icon">?</span>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            {t('Account recovery')}
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          {t('Forgot password?')}
        </h1>
        <p className="mt-2 text-slate-600">
          {t('Enter your Aadhaar number. If your account is eligible, we’ll send a six-digit reset code to its verified email.')}
        </p>

        {(error || message) && (
          <p
            aria-live="polite"
            className={`status-message mt-5 rounded-xl border px-4 py-3 text-sm ${
              error
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-green-200 bg-green-50 text-green-800'
            }`}
            role={error ? 'alert' : 'status'}
          >
            {error || message}
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

          <button
            className="app-primary-button w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t('Requesting code...') : t('Send reset code')}
          </button>
        </form>

        {message && (
          <button
            className="mt-4 w-full rounded-lg border border-indigo-200 px-4 py-2.5 font-semibold text-indigo-700 hover:bg-indigo-50"
            onClick={continueToReset}
            type="button"
          >
            {t('Enter reset code')}
          </button>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          {t('Remembered it?')}{' '}
          <Link className="font-semibold text-indigo-700 hover:underline" to="/login">
            {t('Back to sign in')}
          </Link>
        </p>
      </section>
    </main>
  )
}

export default ForgotPasswordPage
