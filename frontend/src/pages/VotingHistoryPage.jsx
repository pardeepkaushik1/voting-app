import { useEffect, useEffectEvent, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Loading from '../components/Loading.jsx'
import {
  getMyVotes,
  hideMyVoteHistory,
} from '../services/electionService.js'
import { useLanguage } from '../context/useLanguage.js'

function formatVoteTime(value, language) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? language === 'hi' ? 'समय उपलब्ध नहीं' : 'Time unavailable'
    : date.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')
}

function VotingHistoryPage() {
  const { language, t } = useLanguage()
  const translateInEffect = useEffectEvent(t)
  const [votes, setVotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [voteToHide, setVoteToHide] = useState(null)
  const [isHiding, setIsHiding] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isCurrent = true

    getMyVotes()
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error(translateInEffect('The server returned invalid voting history.'))
        }
        if (isCurrent) setVotes(data)
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(translateInEffect(requestError.message || 'Could not load your voting history.'))
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  async function handleHideVote() {
    if (!voteToHide) return

    setIsHiding(true)
    setError('')
    setSuccess('')
    try {
      await hideMyVoteHistory(voteToHide._id)
      setVotes((current) => current.filter((vote) => vote._id !== voteToHide._id))
      setSuccess(t('The entry was removed from your history. Your recorded vote and election totals are unchanged.'))
      setVoteToHide(null)
    } catch (requestError) {
      setError(t(requestError.message || 'Could not remove this history entry.'))
    } finally {
      setIsHiding(false)
    }
  }

  return (
    <main className="app-page mx-auto w-full max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          {t('Your account')}
        </p>
        <h1 className="app-page-heading mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {t('Election history')}
        </h1>
        <p className="mt-2 text-slate-600">
          {t('Your recorded choices and the time each vote was submitted.')}
        </p>
      </header>

      {error && (
        <p aria-live="polite" className="status-message rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p aria-live="polite" className="status-message rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          {success}
        </p>
      )}

      {isLoading ? (
        <Loading message={t('Loading your election history...')} />
      ) : votes.length === 0 ? (
        <p className="app-surface p-8 text-center text-slate-600">
          {t('You have not voted in an election yet.')}
        </p>
      ) : (
        <ol className="space-y-3">
          {votes.map((vote) => (
            <li className="app-surface p-5 sm:p-6" key={vote._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{vote.electionName}</h2>
                  <p className="mt-2 text-slate-600">
                    {t('Your vote:')} <span className="font-medium text-slate-900">{vote.candidateName}</span>
                    {vote.candidateParty ? ` · ${vote.candidateParty}` : ''}
                  </p>
                </div>
                <time className="text-sm text-slate-500" dateTime={vote.votedAt}>
                  {formatVoteTime(vote.votedAt, language)}
                </time>
              </div>
              <button
                className="mt-4 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                disabled={isHiding}
                onClick={() => setVoteToHide(vote)}
                type="button"
              >
                {t('Remove from my history')}
              </button>
            </li>
          ))}
        </ol>
      )}
      <ConfirmDialog
        cancelText={t('Keep entry')}
        confirmingText={t('Removing...')}
        confirmText={t('Remove from history')}
        isConfirming={isHiding}
        isOpen={voteToHide !== null}
        message={t('This hides the entry from your history. The vote itself and election results will not change.')}
        onCancel={() => setVoteToHide(null)}
        onConfirm={handleHideVote}
        title={t('Remove history entry?')}
      />
    </main>
  )
}

export default VotingHistoryPage
