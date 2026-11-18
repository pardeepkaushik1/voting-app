import { useEffect, useEffectEvent, useState } from 'react'
import Loading from '../components/Loading.jsx'
import { useLanguage } from '../context/useLanguage.js'
import {
  getMyComplaints,
  submitComplaint as submitComplaintRequest,
} from '../services/complaintService.js'

function formatDate(value, language) {
  return new Date(value).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')
}

function ComplaintsPage() {
  const { language, t } = useLanguage()
  const translateInEffect = useEffectEvent(t)
  const [complaints, setComplaints] = useState([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isCurrent = true
    getMyComplaints()
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error('The server returned invalid complaint data.')
        }
        if (isCurrent) setComplaints(data)
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(translateInEffect(requestError.message || 'Could not load complaints.'))
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      const result = await submitComplaintRequest({ subject, message })
      setComplaints((current) => [result.complaint, ...current])
      setSubject('')
      setMessage('')
      setSuccess(t('Complaint submitted successfully.'))
    } catch (requestError) {
      setError(t(requestError.message || 'Could not submit your complaint.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function renderComplaint(complaint) {
    return (
      <article className="app-surface space-y-3 p-5 sm:p-6" key={complaint._id}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">{complaint.subject}</h3>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            complaint.status === 'resolved'
              ? 'bg-green-100 text-green-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {t(complaint.status === 'resolved' ? 'Resolved' : 'Pending')}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{complaint.message}</p>
        <p className="text-xs text-slate-500">
          {t('Submitted on')}: {formatDate(complaint.createdAt, language)}
        </p>
        <div className="rounded-lg bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-800">{t('Admin reply')}</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
            {complaint.adminReply || t('No admin reply yet.')}
          </p>
        </div>
      </article>
    )
  }

  return (
    <main className="app-page mx-auto w-full max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{t('Feedback and complaints')}</p>
        <h1 className="app-page-heading mt-2 text-3xl font-bold tracking-tight text-slate-900">{t('Complaints')}</h1>
        <p className="mt-2 text-slate-600">{t('Submit a complaint or feedback.')}</p>
      </header>

      {(error || success) && (
        <p
          aria-live="polite"
          className={`status-message rounded-xl border px-4 py-3 text-sm ${
            error ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'
          }`}
          role={error ? 'alert' : 'status'}
        >
          {error || success}
        </p>
      )}

      <section className="app-surface p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">{t('Submit a complaint')}</h2>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('Subject')}</span>
            <input
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              maxLength={120}
              onChange={(event) => setSubject(event.target.value)}
              required
              value={subject}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('Describe your problem or feedback')}</span>
            <textarea
              className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              maxLength={3000}
              onChange={(event) => setMessage(event.target.value)}
              required
              rows={5}
              value={message}
            />
            <span className="block text-right text-xs text-slate-500">{message.length}/3000</span>
          </label>
          <button
            className="app-primary-button rounded-lg px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t('Submitting...') : t('Submit complaint')}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">{t('Your complaints')}</h2>
        {isLoading ? (
          <Loading message={t('Loading complaints...')} />
        ) : complaints.length === 0 ? (
          <p className="app-surface p-6 text-center text-slate-600">{t('No complaints submitted yet.')}</p>
        ) : (
          <div className="space-y-3">{complaints.map(renderComplaint)}</div>
        )}
      </section>
    </main>
  )
}

export default ComplaintsPage
