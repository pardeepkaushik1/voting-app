import { lazy, Suspense, useEffect, useEffectEvent, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Loading from '../components/Loading.jsx'
import {
  deleteRegisteredUser,
  getRegisteredUsers,
  setUserBlocked,
} from '../services/adminService.js'
import {
  createElection,
  deleteElectionHistory,
  getElectionProgress,
  getElections,
  setElectionStatus,
  setResultsPublished,
} from '../services/electionService.js'
import { getCandidates } from '../services/candidateService.js'
import { useLanguage } from '../context/useLanguage.js'

const PartyVoteChart = lazy(() => import('../components/PartyVoteChart.jsx'))

function AdminDashboardPage() {
  const { t } = useLanguage()
  const translateInEffect = useEffectEvent(t)
  const { pathname } = useLocation()
  const activeSection = pathname === '/admin/users'
    ? 'users'
    : pathname === '/admin/elections/new'
      ? 'create'
      : 'elections'
  const [elections, setElections] = useState([])
  const [candidates, setCandidates] = useState([])
  const [users, setUsers] = useState([])
  const [progress, setProgress] = useState({})
  const [progressErrors, setProgressErrors] = useState({})
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [candidateIds, setCandidateIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [pendingElectionId, setPendingElectionId] = useState(null)
  const [pendingUserId, setPendingUserId] = useState(null)
  const [electionToDelete, setElectionToDelete] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)

  useEffect(() => {
    let isCurrent = true

    Promise.all([getElections(), getCandidates(), getRegisteredUsers()])
      .then(([electionData, candidateData, userData]) => {
        if (!Array.isArray(electionData) || !Array.isArray(candidateData) || !Array.isArray(userData)) {
          throw new Error(translateInEffect('The server returned invalid dashboard data.'))
        }
        if (isCurrent) {
          setElections(electionData)
          setCandidates(candidateData)
          setUsers(userData)
          setProgress(
            Object.fromEntries(
              electionData.map((election) => [
                election._id,
                {
                  totalVotes: election.totalVotes,
                  candidates: election.candidates.map((candidate) => ({
                    candidateId: candidate.candidateId ?? candidate._id,
                    name: candidate.name,
                    party: candidate.party,
                    votes: candidate.votes ?? 0,
                  })),
                },
              ]),
            ),
          )
          setError('')
        }
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(translateInEffect(requestError.message || 'Could not load the admin dashboard.'))
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [reloadKey])

  const activeElectionIds = elections
    .filter((election) => election.status === 'active')
    .map((election) => election._id)
  const registeredVoterCount = users.filter((user) => user.role === 'voter').length
  const activeElectionKey = activeElectionIds.join(',')
  const totalVotesAcrossElections = elections.reduce(
    (total, election) =>
      total + (progress[election._id]?.totalVotes ?? election.totalVotes ?? 0),
    0,
  )
  const completedElections = elections.filter(
    (election) => election.status === 'stopped',
  )

  useEffect(() => {
    if (!activeElectionKey) return undefined

    let isCurrent = true
    const electionIds = activeElectionKey.split(',')

    async function refreshProgress() {
      const results = await Promise.allSettled(
        electionIds.map((id) => getElectionProgress(id)),
      )
      if (!isCurrent) return

      const nextErrors = {}
      results.forEach((result, index) => {
        const electionId = electionIds[index]
        if (result.status === 'fulfilled') {
          setProgress((current) => ({ ...current, [electionId]: result.value }))
        } else {
          nextErrors[electionId] =
            translateInEffect(result.reason.message || 'Could not refresh election progress.')
        }
      })
      setProgressErrors(nextErrors)
    }

    refreshProgress()
    const intervalId = window.setInterval(refreshProgress, 5000)
    return () => {
      isCurrent = false
      window.clearInterval(intervalId)
    }
  }, [activeElectionKey])

  function reloadDashboard() {
    setIsLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }

  function toggleCandidate(candidateId) {
    setCandidateIds((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId],
    )
  }

  async function handleCreateElection(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    try {
      await createElection({
        name: name.trim(),
        description: description.trim(),
        candidateIds,
      })
      setName('')
      setDescription('')
      setCandidateIds([])
      setSuccess(t('Election created. Start it when the ballot is ready.'))
      reloadDashboard()
    } catch (requestError) {
      setError(t(requestError.message || 'Could not create the election.'))
    }
  }

  async function handleElectionAction(election, action) {
    setPendingElectionId(election._id)
    setError('')
    setSuccess('')
    try {
      if (action === 'status') {
        const status = election.status === 'active' ? 'stopped' : 'active'
        await setElectionStatus(election._id, status)
        setSuccess(t(status === 'active' ? 'Election started.' : 'Election stopped.'))
      } else {
        const published = !election.resultsPublished
        await setResultsPublished(election._id, published)
        setSuccess(t(published ? 'Election results published.' : 'Election results hidden.'))
      }
      reloadDashboard()
    } catch (requestError) {
      setError(t(requestError.message || 'Could not update the election.'))
    } finally {
      setPendingElectionId(null)
    }
  }

  async function handleDeleteElection() {
    if (!electionToDelete) return

    setPendingElectionId(electionToDelete._id)
    setError('')
    setSuccess('')
    try {
      await deleteElectionHistory(electionToDelete._id)
      setElections((current) =>
        current.filter((election) => election._id !== electionToDelete._id),
      )
      setProgress((current) => {
        const next = { ...current }
        delete next[electionToDelete._id]
        return next
      })
      setSuccess(t('"{name}" and its vote history were deleted.', { name: electionToDelete.name }))
      setElectionToDelete(null)
    } catch (requestError) {
      setError(t(requestError.message || 'Could not delete the election history.'))
    } finally {
      setPendingElectionId(null)
    }
  }

  async function handleUserAction(user) {
    setPendingUserId(user._id)
    setError('')
    setSuccess('')
    try {
      await setUserBlocked(user._id, !user.isBlocked)
      setUsers((current) =>
        current.map((item) =>
          item._id === user._id ? { ...item, isBlocked: !user.isBlocked } : item,
        ),
      )
      setSuccess(t(user.isBlocked ? '{name} was unblocked.' : '{name} was blocked.', { name: user.name }))
    } catch (requestError) {
      setError(t(requestError.message || 'Could not update the user.'))
    } finally {
      setPendingUserId(null)
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return

    setPendingUserId(userToDelete._id)
    setError('')
    setSuccess('')
    try {
      await deleteRegisteredUser(userToDelete._id)
      setUsers((current) => current.filter((user) => user._id !== userToDelete._id))
      setSuccess(t('{name} and their voting data were deleted.', { name: userToDelete.name }))
      setUserToDelete(null)
    } catch (requestError) {
      setError(t(requestError.message || 'Could not delete the user.'))
    } finally {
      setPendingUserId(null)
    }
  }

  return (
    <main className="app-page mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            {t('Administration')}
          </p>
          <h1 className="app-page-heading mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {t(activeSection === 'create'
              ? 'Create a new election'
              : activeSection === 'users'
                ? 'Registered users'
                : 'Elections and live statistics')}
          </h1>
          <p className="mt-2 text-slate-600">
            {t(activeSection === 'create'
              ? 'Set up an election and choose the candidates on its ballot.'
              : activeSection === 'users'
                ? 'Review voter accounts and manage access.'
                : 'Monitor turnout, candidate totals, and election results.')}
          </p>
        </div>
        <button
          className="rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-white hover:text-indigo-700 disabled:opacity-60"
          disabled={isLoading}
          onClick={reloadDashboard}
          type="button"
        >
          {t('Refresh dashboard')}
        </button>
      </header>

      <nav aria-label={t('Admin dashboard sections')} className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {[
          { label: 'Elections & statistics', to: '/admin', end: true },
          { label: 'Create election', to: '/admin/elections/new' },
          { label: 'Registered users', to: '/admin/users' },
          { label: 'Complaints', to: '/admin/complaints' },
        ].map((item) => (
          <NavLink
            className={({ isActive }) =>
              `rounded-lg px-4 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`
            }
            end={item.end}
            key={item.to}
            to={item.to}
          >
            {t(item.label)}
          </NavLink>
        ))}
      </nav>

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
        <Loading message={t('Loading elections and registered users...')} />
      ) : (
        <>
          {activeSection === 'elections' && (
            <>
              <section aria-label={t('Election overview')} className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  {
                    label: t('Total elections'),
                    value: elections.length,
                    detail: t('All elections created'),
                    tone: 'blue',
                  },
                  {
                    label: t('Active elections'),
                    value: activeElectionIds.length,
                    detail: t('Currently accepting votes'),
                    tone: 'green',
                  },
                  {
                    label: t('Registered voters'),
                    value: registeredVoterCount,
                    detail: t('Voter accounts only'),
                    tone: 'violet',
                  },
                  {
                    label: t('Votes cast'),
                    value: totalVotesAcrossElections,
                    detail: t('Across all elections'),
                    tone: 'cyan',
                  },
                ].map((stat) => (
                  <article
                    className={`admin-stat-card admin-stat-card-${stat.tone}`}
                    key={stat.label}
                  >
                    <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                    <p className="admin-stat-card-value mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
                  </article>
                ))}
              </section>

              <Suspense fallback={<Loading message={t('Loading party vote chart...')} />}>
                <PartyVoteChart elections={elections} />
              </Suspense>

              <section aria-labelledby="results-overview-heading" className="admin-results-panel app-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                      {t('Summary')}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900" id="results-overview-heading">
                      {t('Results overview')}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600">
                    {t('{count} completed {unit}', {
                      count: completedElections.length,
                      unit: t(completedElections.length === 1 ? 'election' : 'elections'),
                    })}
                  </p>
                </div>
                {completedElections.length === 0 ? (
                  <p className="mt-5 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-600">
                    {t('Completed election summaries will appear here.')}
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {completedElections.map((election) => {
                      const electionProgress = progress[election._id] || election
                      const leadingCandidate = [...(electionProgress.candidates || [])]
                        .sort((left, right) => right.votes - left.votes)[0]
                      return (
                        <article className="admin-result-card" key={election._id}>
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold text-slate-900">{election.name}</h3>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              election.resultsPublished
                                ? 'bg-green-50 text-green-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {t(election.resultsPublished ? 'Published' : 'Hidden')}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-slate-600">
                            {t('Total votes:')} <span className="font-semibold text-slate-900">{electionProgress.totalVotes ?? 0}</span>
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {t('Leading candidate:')}{' '}
                            <span className="font-semibold text-slate-900">
                              {leadingCandidate?.name ?? t('No votes yet')}
                            </span>
                            {leadingCandidate ? ` · ${leadingCandidate.votes} ${t('votes')}` : ''}
                          </p>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {activeSection === 'create' && (
          <section aria-labelledby="create-election-heading" className="app-surface p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-slate-900" id="create-election-heading">
              {t('Create a new election')}
            </h2>
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleCreateElection}>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">{t('Election name')}</span>
                <input
                  className="app-input w-full rounded-lg border px-3 py-2 text-slate-900 outline-none"
                  maxLength={120}
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">{t('Description (optional)')}</span>
                <input
                  className="app-input w-full rounded-lg border px-3 py-2 text-slate-900 outline-none"
                  maxLength={1000}
                  onChange={(event) => setDescription(event.target.value)}
                  value={description}
                />
              </label>
              <fieldset className="space-y-2 sm:col-span-2">
                <legend className="text-sm font-medium text-slate-700">{t('Candidates on this ballot')}</legend>
                {candidates.length === 0 ? (
                  <p className="text-sm text-slate-600">{t('Add candidates before creating an election.')}</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {candidates.map((candidate) => (
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700" key={candidate._id}>
                        <input
                          checked={candidateIds.includes(candidate._id)}
                          onChange={() => toggleCandidate(candidate._id)}
                          type="checkbox"
                        />
                        {candidate.candidateImage?.url ? (
                          <img
                            alt=""
                            className="h-12 w-12 rounded-full object-cover"
                            src={candidate.candidateImage.url}
                          />
                        ) : (
                          <span aria-hidden="true" className="h-12 w-12 rounded-full bg-slate-100" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{candidate.name}</span>
                          <span className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                            {candidate.partyImage?.url && (
                              <img
                                alt=""
                                className="h-6 w-6 rounded object-cover"
                                src={candidate.partyImage.url}
                              />
                            )}
                            {candidate.party}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
              <button
                className="app-primary-button rounded-lg px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
                disabled={candidates.length === 0 || candidateIds.length === 0}
                type="submit"
              >
                {t('Create election')}
              </button>
            </form>
          </section>
          )}

          {activeSection === 'elections' && (
          <section aria-labelledby="elections-heading" className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900" id="elections-heading">
              {t('Elections and live statistics')}
            </h2>
            {elections.length === 0 ? (
              <p className="app-surface p-6 text-slate-600">{t('No elections have been created yet.')}</p>
            ) : (
              elections.map((election) => {
                const electionProgress = progress[election._id] || election
                const totalVotes = electionProgress.totalVotes ?? 0
                const turnout = electionProgress.turnoutPercent ?? 0
                return (
                  <article className="app-surface space-y-4 p-5 sm:p-6" key={election._id}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">{election.name}</h3>
                          {election.status === 'active' ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                              {t('Active')}
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                              {election.status}
                            </span>
                          )}
                        </div>
                        {election.description && <p className="mt-1 text-sm text-slate-600">{election.description}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                          disabled={pendingElectionId === election._id || (election.resultsPublished && election.status !== 'active')}
                          onClick={() => handleElectionAction(election, 'status')}
                          type="button"
                        >
                          {t(election.status === 'active' ? 'Stop election' : 'Start election')}
                        </button>
                        <button
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                          disabled={pendingElectionId === election._id || (!election.resultsPublished && election.status !== 'stopped')}
                          onClick={() => handleElectionAction(election, 'results')}
                          type="button"
                        >
                          {t(election.resultsPublished ? 'Hide results' : 'Publish results')}
                        </button>
                        <button
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={election.status === 'active' || pendingElectionId === election._id}
                          onClick={() => setElectionToDelete(election)}
                          type="button"
                        >
                          {t('Delete history')}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="admin-election-stat rounded-lg p-3">
                        <p className="text-sm text-slate-600">{t('Total votes')}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{totalVotes}</p>
                      </div>
                      <div className="admin-election-stat rounded-lg p-3">
                        <p className="text-sm text-slate-600">{t('Registered voters')}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{electionProgress.registeredVoters ?? users.filter((user) => user.role === 'voter').length}</p>
                      </div>
                      <div className="admin-election-stat rounded-lg p-3">
                        <p className="text-sm text-slate-600">{t('Turnout')}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{turnout}%</p>
                      </div>
                    </div>

                    {election.status === 'active' && (
                      <div>
                        <div className="admin-progress-track h-3 overflow-hidden rounded-full" role="progressbar" aria-label={t('{name} turnout', { name: election.name })} aria-valuemax="100" aria-valuemin="0" aria-valuenow={Math.min(turnout, 100)}>
                          <div className="admin-progress-fill h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(turnout, 100)}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{t('Live progress refreshes every 5 seconds.')}</p>
                        {progressErrors[election._id] && (
                          <p className="mt-1 text-sm text-red-700" role="status">{progressErrors[election._id]}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{t('Candidate statistics')}</h4>
                      <ul className="mt-2 divide-y divide-slate-200">
                        {(electionProgress.candidates || []).map((candidate) => (
                          <li className="flex justify-between gap-4 py-2 text-sm" key={candidate.candidateId}>
                            <span className="text-slate-700">{candidate.name} · {candidate.party}</span>
                            <span className="font-semibold text-slate-900">{candidate.votes} {t('votes')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t('Results are')} {t(election.resultsPublished ? 'visible to voters' : 'hidden from voters')}.
                    </p>
                  </article>
                )
              })
            )}
          </section>
          )}

          {activeSection === 'users' && (
          <section aria-labelledby="users-heading" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900" id="users-heading">
                  {t('Registered users')}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{t('{count} accounts', { count: users.length })}</p>
              </div>
            </div>
            {users.length === 0 ? (
              <p className="app-surface p-6 text-slate-600">{t('No registered users found.')}</p>
            ) : (
              <div className="app-surface overflow-x-auto">
                <table className="w-full min-w-[42rem] text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">{t('Name')}</th>
                      <th className="px-4 py-3 font-semibold">{t('Contact')}</th>
                      <th className="px-4 py-3 font-semibold">{t('Voting')}</th>
                      <th className="px-4 py-3 font-semibold">{t('Account')}</th>
                      <th className="px-4 py-3 font-semibold">{t('Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {user.name}
                          <span className="mt-1 block text-xs capitalize text-slate-500">{t(user.role)}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {user.email || user.mobile || t('Not provided')}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {t(user.isVoted ? 'Has voted' : 'Not voted')}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {t(user.isBlocked ? 'Blocked' : 'Active')}
                        </td>
                        <td className="px-4 py-3">
                          {user.role === 'admin' ? (
                            <span className="text-slate-500">{t('Admin')}</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button
                                className={`rounded-lg border px-3 py-1.5 font-medium disabled:opacity-60 ${
                                  user.isBlocked
                                    ? 'border-green-200 text-green-700 hover:bg-green-50'
                                    : 'border-red-200 text-red-700 hover:bg-red-50'
                                }`}
                                disabled={pendingUserId !== null}
                                onClick={() => handleUserAction(user)}
                                type="button"
                              >
                                {t(user.isBlocked ? 'Unblock' : 'Block')}
                              </button>
                              <button
                                className="rounded-lg border border-red-300 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                                disabled={pendingUserId !== null}
                                onClick={() => setUserToDelete(user)}
                                type="button"
                              >
                                {t('Delete')}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          )}
        </>
      )}
      <ConfirmDialog
        cancelText={t('Keep election')}
        confirmingText={t('Deleting...')}
        confirmText={t('Delete election')}
        isConfirming={pendingElectionId !== null}
        isOpen={electionToDelete !== null}
        message={t('Permanently delete "{name}" and all of its recorded votes? This cannot be undone.', {
          name: electionToDelete?.name ?? t('this election'),
        })}
        onCancel={() => setElectionToDelete(null)}
        onConfirm={handleDeleteElection}
        title={t('Delete election history?')}
      />
      <ConfirmDialog
        cancelText={t('Keep user')}
        confirmingText={t('Deleting...')}
        confirmText={t('Delete user')}
        isConfirming={pendingUserId !== null}
        isOpen={userToDelete !== null}
        message={t('Permanently delete "{name}" and their account and recorded voting data? Their votes will be removed from election totals. This cannot be undone.', {
          name: userToDelete?.name ?? t('this user'),
        })}
        onCancel={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title={t('Delete registered user?')}
      />
    </main>
  )
}

export default AdminDashboardPage
