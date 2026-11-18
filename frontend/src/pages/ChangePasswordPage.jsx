import { useState } from 'react'
import { Link } from 'react-router-dom'
import { changePassword } from '../services/userService.js'
import { useLanguage } from '../context/useLanguage.js'

function ChangePasswordPage() {
  const { t } = useLanguage()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError(t('New password and confirmation do not match.'))
      return
    }

    setIsSubmitting(true)

    try {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(t('Your password has been updated.'))
    } catch (requestError) {
      setError(t(requestError.message || 'Could not update your password.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-page mx-auto w-full max-w-xl space-y-6 px-4 py-10 sm:px-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          {t('Account security')}
        </p>
        <h1 className="app-page-heading mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {t('Change password')}
        </h1>
        <p className="mt-2 text-slate-600">
          {t('Enter your current password and choose a new one.')}
        </p>
      </header>

      {(error || success) && (
        <p
          aria-live="polite"
          className={`status-message rounded-xl border px-4 py-3 text-sm ${
            error
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-green-200 bg-green-50 text-green-800'
          }`}
          role={error ? 'alert' : 'status'}
        >
          {error || success}
        </p>
      )}

      <form
        className="app-surface space-y-4 p-6 sm:p-8"
        onSubmit={handleSubmit}
      >
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">
            {t('Current password')}
          </span>
          <input
            autoComplete="current-password"
            className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            type="password"
            value={currentPassword}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">
            {t('New password')}
          </span>
          <input
            autoComplete="new-password"
            className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            className="app-primary-button rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t('Updating...') : t('Update password')}
          </button>
          <Link
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
            to="/profile"
          >
            {t('Back to profile')}
          </Link>
        </div>
      </form>
    </main>
  )
}

export default ChangePasswordPage