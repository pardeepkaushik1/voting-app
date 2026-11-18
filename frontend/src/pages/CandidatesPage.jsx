import { useEffect, useEffectEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Loading from '../components/Loading.jsx'
import {
  getElections,
  getPublishedResults,
  voteInElection,
} from '../services/electionService.js'
import { useLanguage } from '../context/useLanguage.js'

function CandidatesPage() {
  const { t } = useLanguage()
  const translateInEffect = useEffectEvent(t)
  const [elections, setElections] = useState([])
  const [publishedResults, setPublishedResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [candidateToVote, setCandidateToVote] = useState(null)
  const [error, setError] = useState('')
  const [resultsError, setResultsError] = useState('')
  const [success, setSuccess] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    Promise.allSettled([getElections(), getPublishedResults()])
      .then(([electionResult, publishedResult]) => {
        if (!isCurrent) return

        if (electionResult.status === 'fulfilled' && Array.isArray(electionResult.value)) {
          setElections(electionResult.value)
          setError('')
        } else {
          const requestError = electionResult.status === 'rejected'
            ? electionResult.reason
            : new Error('The server returned an invalid election list.')
          setError(translateInEffect(requestError.message || 'Could not load active elections.'))
        }

        if (publishedResult.status === 'fulfilled' && Array.isArray(publishedResult.value)) {
          setPublishedResults(publishedResult.value)
          setResultsError('')
        } else {
          const requestError = publishedResult.status === 'rejected'
            ? publishedResult.reason
            : new Error('The server returned invalid published results.')
          setResultsError(translateInEffect(requestError.message || 'Could not load published results.'))
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [reloadKey])

  async function handleVote() {
    if (!candidateToVote) return

    setIsVoting(true)
    setError('')
    setSuccess('')
    try {
      await voteInElection(candidateToVote.electionId, candidateToVote.candidate._id)
      setSuccess(t('Your vote in {election} was recorded.', { election: candidateToVote.electionName }))
      setCandidateToVote(null)
      setReloadKey((key) => key + 1)
    } catch (voteError) {
      setError(t(voteError.message || 'Could not submit your vote.'))
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <main className="app-page mx-auto w-full max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            {t('Voter dashboard')}
          </p>
          <h1 className="app-page-heading mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {t('Active elections')}
          </h1>
          <p className="mt-2 text-slate-600">
            {t('Select one candidate in each active election. Your vote cannot be changed.')}
          </p>
        </div>
        <button
          className="rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-white hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          onClick={() => {
            setIsLoading(true)
            setError('')
            setReloadKey((key) => key + 1)
          }}
          type="button"
        >
          {t('Refresh')}
        </button>
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
        <Loading message={t('Loading active elections...')} />
      ) : elections.length === 0 ? (
        <section className="app-surface rounded-xl p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">{t('No active elections')}</h2>
          <p className="mt-2 text-slate-600">
            {t('When an administrator starts an election, it will appear here.')}
          </p>
          <Link className="mt-4 inline-flex font-semibold text-indigo-700 hover:underline" to="/voting-history">
            {t('View your election history')}
          </Link>
        </section>
      ) : (
        <div className="space-y-6">
          {elections.map((election) => (
            <section className="app-surface space-y-5 p-5 sm:p-6" key={election._id}>
              <header>
                <h2 className="text-xl font-semibold text-slate-900">{election.name}</h2>
                {election.description && (
                  <p className="mt-2 text-slate-600">{election.description}</p>
                )}
              </header>
              {election.hasVoted ? (
                <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                  {t('Your vote in this election has been recorded.')}{' '}
                  <Link className="underline" to="/voting-history">{t('View your history')}</Link>
                </p>
              ) : (
                <ul className="space-y-3">
                  {election.candidates.map((candidate) => (
                    <li className="candidate-surface flex flex-wrap items-center justify-between gap-4 p-4" key={candidate._id}>
                      <div className="flex min-w-0 items-center gap-4">
                        {candidate.candidateImage?.url ? (
                          <img
                            alt={`${candidate.name}`}
                            className="h-16 w-16 shrink-0 rounded-full object-cover"
                            src={candidate.candidateImage.url}
                          />
                        ) : (
                          <span aria-hidden="true" className="h-16 w-16 shrink-0 rounded-full bg-slate-100" />
                        )}
                        <div>
                          <h3 className="font-semibold text-slate-900">{candidate.name}</h3>
                          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                            {candidate.partyImage?.url && (
                              <img
                                alt=""
                                className="h-8 w-8 rounded object-cover"
                                src={candidate.partyImage.url}
                              />
                            )}
                            <span>{candidate.party}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isVoting}
                        onClick={() => setCandidateToVote({
                          electionId: election._id,
                          electionName: election.name,
                          candidate,
                        })}
                        type="button"
                      >
                        {t('Vote for candidate')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {resultsError && (
        <p aria-live="polite" className="status-message rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {t('Published results could not be loaded: {error}', { error: resultsError })}
        </p>
      )}
      {publishedResults.length > 0 && (
        <section aria-labelledby="published-results-heading" className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{t('Final results')}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900" id="published-results-heading">
              {t('Published election results')}
            </h2>
          </div>
          {publishedResults.map((election) => {
            const highestVotes = Math.max(
              0,
              ...election.candidates.map((candidate) => candidate.votes),
            )
            const leaders = election.candidates.filter(
              (candidate) => highestVotes > 0 && candidate.votes === highestVotes,
            )
            const winner = leaders.length === 1 ? leaders[0] : null

            return (
              <article className="app-surface p-5 sm:p-6" key={election._id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{election.name}</h3>
                  <p className="text-sm text-slate-600">{t('Total votes:')} {election.totalVotes}</p>
                </div>
                {election.description && <p className="mt-1 text-sm text-slate-600">{election.description}</p>}
                {winner ? (
                  <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900" role="status">
                    {t('Congratulations, {name}! You won this election.', { name: winner.name })}
                  </p>
                ) : leaders.length > 1 ? (
                  <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700" role="status">
                    {t('This election ended in a tie between {names}.', { names: leaders.map((candidate) => candidate.name).join(', ') })}
                  </p>
                ) : null}
                <ol className="mt-3 divide-y divide-slate-200">
                  {election.candidates.map((candidate) => (
                    <li className="flex justify-between gap-4 py-2 text-sm" key={candidate.candidateId}>
                      <span className="text-slate-700">
                        {candidate.candidateId === winner?.candidateId && (
                          <span aria-label={t('Winner')} className="mr-1" role="img">👑</span>
                        )}
                        {candidate.name} · {candidate.party}
                      </span>
                      <span className="font-semibold text-slate-900">{candidate.votes} {t('votes')}</span>
                    </li>
                  ))}
                </ol>
              </article>
            )
          })}
        </section>
      )}

      <ConfirmDialog
        cancelText={t('Choose later')}
        confirmingText={t('Recording vote...')}
        confirmText={t('Confirm vote')}
        isConfirming={isVoting}
        isOpen={candidateToVote !== null}
        message={t('Cast your vote for {candidate} in {election}? Your vote cannot be changed.', {
          candidate: candidateToVote?.candidate.name ?? t('this candidate'),
          election: candidateToVote?.electionName ?? t('this election'),
        })}
        onCancel={() => setCandidateToVote(null)}
        onConfirm={handleVote}
        title={t('Confirm your vote')}
      />
    </main>
  )
}

export default CandidatesPage
