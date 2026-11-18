import { useLanguage } from '../context/useLanguage.js'

function CandidateCard({
  candidate,
  voteCount,
  hasVoted,
  isVoting,
  onVote,
}) {
  const { t } = useLanguage()
  return (
    <article className="candidate-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {candidate.name}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{candidate.party}</p>
        <p className="mt-3 text-sm font-medium text-slate-700">
          {t('Votes:')} {voteCount ?? '—'}
        </p>
      </div>

      {hasVoted ? (
        <span className="rounded-lg bg-slate-100 px-4 py-2 text-center text-sm font-medium text-slate-600">
          {t('Voting completed')}
        </span>
      ) : (
        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isVoting}
          onClick={onVote}
          type="button"
        >
          {isVoting ? t('Submitting vote...') : t('Vote for candidate')}
        </button>
      )}
    </article>
  )
}

export default CandidateCard