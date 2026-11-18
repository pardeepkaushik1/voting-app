import { useEffect, useEffectEvent, useState } from 'react'
import Loading from '../components/Loading.jsx'
import { useLanguage } from '../context/useLanguage.js'
import {
  getAllComplaints,
  updateComplaint,
} from '../services/complaintService.js'

function formatDate(value, language) {
  return new Date(value).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')
}

function AdminComplaintsPage() {
  const { language, t } = useLanguage()
  const translateInEffect = useEffectEvent(t)
  const [complaints, setComplaints] = useState([])
  const [drafts, setDrafts] = useState({})
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isCurrent = true
    getAllComplaints()
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error('The server returned invalid complaint data.')
        }
        if (isCurrent) {
          setComplaints(data)
          setDrafts(Object.fromEntries(data.map((complaint) => [
            complaint._id,
            { adminReply: complaint.adminReply || '', status: complaint.status },
          ])))
        }
      })
      .catch((requestError) => {
        if (isCurrent) setError(translateInEffect(requestError.message || 'Could not load complaints.'))
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  async function handleSave(complaint) {
    setSavingId(complaint._id)
    setError('')
    setSuccess('')
    try {
      const updated = await updateComplaint(complaint._id, drafts[complaint._id])
      setComplaints((current) => current.map((item) => item._id === updated._id ? updated : item))
      setDrafts((current) => ({
        ...current,
        [updated._id]: { adminReply: updated.adminReply, status: updated.status },
      }))
      setSuccess(t('Complaint updated successfully.'))
    } catch (requestError) {
      setError(t(requestError.message || 'Could not update the complaint.'))
    } finally {
      setSavingId(null)
    }
  }

  const visibleComplaints = complaints.filter(
    (complaint) => filter === 'all' || complaint.status === filter,
  )

  return (
    <main className="app-page mx-auto w-full max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{t('Administration')}</p>
          <h1 className="app-page-heading mt-2 text-3xl font-bold tracking-tight text-slate-900">{t('Complaint management')}</h1>
          <p className="mt-2 text-slate-600">{t('Review user complaints, send replies, and update their status.')}</p>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t('Filter by status')}
          <select
            className="app-input rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            onChange={(event) => setFilter(event.target.value)}
            value={filter}
          >
            <option value="all">{t('All')}</option>
            <option value="pending">{t('Pending')}</option>
            <option value="resolved">{t('Resolved')}</option>
          </select>
        </label>
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

      {isLoading ? (
        <Loading message={t('Loading complaints...')} />
      ) : visibleComplaints.length === 0 ? (
        <p className="app-surface p-8 text-center text-slate-600">{t('No complaints found.')}</p>
      ) : (
        <div className="space-y-4">
          {visibleComplaints.map((complaint) => {
            const draft = drafts[complaint._id] || {
              adminReply: complaint.adminReply || '',
              status: complaint.status,
            }
            return (
              <article className="app-surface space-y-4 p-5 sm:p-6" key={complaint._id}>
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{complaint.subject}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {t('Complaint tracking ID')}: <span className="font-mono font-semibold">{complaint.trackingId}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {t('Submitted by')}: {complaint.submittedBy?.name || t('Unknown user')}
                      {complaint.submittedBy?.email ? ` · ${complaint.submittedBy.email}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t('Submitted on')}: {formatDate(complaint.createdAt, language)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    complaint.status === 'resolved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {t(complaint.status === 'resolved' ? 'Resolved' : 'Pending')}
                  </span>
                </header>
                <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">{complaint.message}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">{t('Reply to user')}</span>
                    <textarea
                      className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      maxLength={3000}
                      onChange={(event) => setDrafts((current) => ({
                        ...current,
                        [complaint._id]: { ...draft, adminReply: event.target.value },
                      }))}
                      rows={4}
                      value={draft.adminReply}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">{t('Status')}</span>
                    <select
                      className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                      onChange={(event) => setDrafts((current) => ({
                        ...current,
                        [complaint._id]: { ...draft, status: event.target.value },
                      }))}
                      value={draft.status}
                    >
                      <option value="pending">{t('Pending')}</option>
                      <option value="resolved">{t('Resolved')}</option>
                    </select>
                  </label>
                </div>
                <button
                  className="app-primary-button rounded-lg px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={savingId === complaint._id}
                  onClick={() => handleSave(complaint)}
                  type="button"
                >
                  {savingId === complaint._id ? t('Saving...') : t('Save reply and status')}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}

export default AdminComplaintsPage
