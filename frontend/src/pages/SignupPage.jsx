import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/useLanguage.js'

function SignupPage() {
  const { user, signup } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    age: '',
    address: '',
    aadharCardNumber: '',
    password: '',
    email: '',
    mobile: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return (
      <Navigate
        replace
        to={user.role === 'admin' ? '/admin' : '/candidates'}
      />
    )
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const userDetails = {
      name: form.name.trim(),
      age: Number(form.age),
      address: form.address.trim(),
      aadharCardNumber: form.aadharCardNumber.trim(),
      password: form.password,
      email: form.email.trim().toLowerCase(),
    }

    if (form.mobile.trim()) userDetails.mobile = form.mobile.trim()

    try {
      await signup(userDetails)
      navigate('/verify-email', {
        replace: true,
        state: { email: userDetails.email },
      })
    } catch (signupError) {
      setError(t(signupError.message || 'Could not create your account.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page auth-layout auth-layout-signup">
      <aside className="auth-showcase">
        <div className="auth-showcase-copy">
          <span className="auth-eyebrow">{t('BE PART OF THE CHANGE')}</span>
          <h2>{t('Your voice deserves to be heard.')}</h2>
          <p>
            {t('Create your voter account and be ready to make an informed choice.')}
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
          <div className="ballot-option selected">
            <i>✓</i>
            <span />
          </div>
          <div className="ballot-option">
            <i />
            <span />
          </div>
          <div className="ballot-submit">{t('One voter. One voice.')}</div>
        </div>
        <span aria-hidden="true" className="auth-orbit auth-orbit-one" />
        <span aria-hidden="true" className="auth-orbit auth-orbit-two" />
      </aside>

      <section className="auth-card auth-form-card auth-signup-card">
        <div className="auth-form-heading">
          <span aria-hidden="true" className="auth-form-icon">✦</span>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            {t('Voting application')}
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          {t('Create your account')}
        </h1>
        <p className="mt-2 text-slate-600">
          {t('Sign up as a voter. Administrator accounts cannot be created here.')}
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

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('Full name')}</span>
            <input
              autoComplete="name"
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              maxLength={100}
              name="name"
              onChange={updateField}
              required
              value={form.name}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('Age')}</span>
            <input
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              min="0"
              name="age"
              onChange={updateField}
              required
              step="1"
              type="number"
              value={form.age}
            />
          </label>

          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">{t('Address')}</span>
            <textarea
              autoComplete="street-address"
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              name="address"
              onChange={updateField}
              required
              rows="2"
              value={form.address}
            />
          </label>

          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              {t('Aadhar card number')}
            </span>
            <input
              autoComplete="off"
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              inputMode="numeric"
              maxLength={12}
              minLength={12}
              name="aadharCardNumber"
              onChange={updateField}
              pattern="[0-9]{12}"
              required
              value={form.aadharCardNumber}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              {t('Password')}
            </span>
            <div className="relative">
              <input
                autoComplete="new-password"
                className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                minLength={8}
                name="password"
                onChange={updateField}
                required
                type={showPassword ? 'text' : 'password'}
                value={form.password}
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

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              {t('Mobile (optional)')}
            </span>
            <input
              autoComplete="tel"
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              name="mobile"
              onChange={updateField}
              type="tel"
              value={form.mobile}
            />
          </label>

          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              {t('Email')}
            </span>
            <input
              autoComplete="email"
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              name="email"
              onChange={updateField}
              required
              type="email"
              value={form.email}
            />
          </label>

          <button
            className="app-primary-button mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t('Creating account...') : t('Create account')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {t('Already registered?')}{' '}
          <Link className="font-semibold text-indigo-700 hover:underline" to="/login">
            {t('Sign in')}
          </Link>
        </p>
      </section>
    </main>
  )
}

export default SignupPage
