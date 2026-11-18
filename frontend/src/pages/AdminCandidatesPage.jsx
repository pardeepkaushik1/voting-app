import { useEffect, useEffectEvent, useState } from 'react'
import CandidateForm from '../components/CandidateForm.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import {
  createCandidate,
  deleteCandidate,
  getCandidates,
  updateCandidate,
} from '../services/candidateService.js'
import { useLanguage } from '../context/useLanguage.js'

function AdminCandidatesPage() {
  const { t } = useLanguage()
  const translateInEffect = useEffectEvent(t)
  const [candidates, setCandidates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editingCandidate, setEditingCandidate] = useState(null)
  const [candidateToDelete, setCandidateToDelete] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isCurrent = true

    getCandidates()
      .then((data) => {
        if (isCurrent) {
          setCandidates(data)
        }
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(translateInEffect(requestError.message || 'Could not load candidates.'))
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [reloadKey])

  function reloadCandidates() {
    setIsLoading(true)
    setError('')
    setReloadKey((currentKey) => currentKey + 1)
  }

  async function handleSave(candidateData) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (editingCandidate) {
        await updateCandidate(editingCandidate._id, candidateData)
        setSuccess(t('Candidate updated successfully.'))
        setEditingCandidate(null)
      } else {
        await createCandidate(candidateData)
        setSuccess(t('Candidate added successfully.'))
      }

      reloadCandidates()
    } catch (requestError) {
      setError(t(requestError.message || 'Could not save the candidate.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!candidateToDelete) {
      return
    }

    const candidateId = candidateToDelete._id
    setDeletingId(candidateId)
    setError('')
    setSuccess('')

    try {
      await deleteCandidate(candidateId)
      setCandidates((currentCandidates) =>
        currentCandidates.filter((candidate) => candidate._id !== candidateId),
      )
      setSuccess(t('{name} was deleted.', { name: candidateToDelete.name }))
      setCandidateToDelete(null)
    } catch (requestError) {
      setError(t(requestError.message || 'Could not delete the candidate.'))
    } finally {
      setDeletingId(null)
    }
  }

  function startEditing(candidate) {
    setEditingCandidate(candidate)
    setError('')
    setSuccess('')
  }

  function cancelEditing() {
    setEditingCandidate(null)
    setError('')
  }

  return (
    <main className="app-page mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          {t('Administration')}
        </p>
        <h1 className="app-page-heading mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {t('Manage candidates')}
        </h1>
        <p className="mt-2 text-slate-600">
          {t('Add candidates to the ballot or update and remove existing entries.')}
        </p>
      </header>

      {error && (
        <p
          aria-live="polite"
          className="status-message rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          aria-live="polite"
          className="status-message rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          {success}
        </p>
      )}

      <section className="app-surface p-5 sm:p-6">
        <h2 className="mb-5 text-xl font-semibold text-slate-900">
          {t(editingCandidate ? 'Edit candidate' : 'Add a candidate')}
        </h2>
        <CandidateForm
          candidate={editingCandidate}
          isSubmitting={isSubmitting}
          key={editingCandidate?._id ?? 'new-candidate'}
          onCancel={cancelEditing}
          onSubmit={handleSave}
        />
      </section>

      <section aria-labelledby="candidate-list-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2
            className="text-xl font-semibold text-slate-900"
            id="candidate-list-heading"
          >
            {t('Current candidates')}
          </h2>
          <button
            className="rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-white hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={reloadCandidates}
            type="button"
          >
            {t('Refresh')}
          </button>
        </div>

        {isLoading ? (
          <p className="app-surface p-5 text-slate-600">
            {t('Loading candidates...')}
          </p>
        ) : candidates.length === 0 ? (
          <p className="app-surface border-dashed p-8 text-center text-slate-600">
            {t('No candidates found. Add the first candidate using the form above.')}
          </p>
        ) : (
          <ul className="space-y-3">
            {candidates.map((candidate) => (
              <li
                className="candidate-surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                key={candidate._id}
              >
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {candidate.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {candidate.party}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                    onClick={() => startEditing(candidate)}
                    type="button"
                  >
                    {t('Edit')}
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deletingId === candidate._id}
                    onClick={() => setCandidateToDelete(candidate)}
                    type="button"
                  >
                    {t('Delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        cancelText={t('Keep candidate')}
        confirmingText={t('Deleting...')}
        confirmText={t('Delete candidate')}
        isConfirming={deletingId !== null}
        isOpen={candidateToDelete !== null}
        message={t('Delete {name}? This action cannot be undone.', {
          name: candidateToDelete?.name ?? t('this candidate'),
        })}
        onCancel={() => setCandidateToDelete(null)}
        onConfirm={handleDelete}
        title={t('Delete candidate')}
      />
    </main>
  )
}

export default AdminCandidatesPage