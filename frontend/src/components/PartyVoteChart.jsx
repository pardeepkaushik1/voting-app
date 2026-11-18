import { useEffect, useEffectEvent, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Loading from './Loading.jsx'
import { useTheme } from '../context/useTheme.js'
import { getPartyVoteStatistics } from '../services/electionService.js'
import { useLanguage } from '../context/useLanguage.js'

function getPartyColor(index) {
  return `hsl(${(index * 137.508 + 195) % 360} 68% 50%)`
}

function PartyVoteChart({ elections }) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const translateInEffect = useEffectEvent(t)
  const [selectedElectionId, setSelectedElectionId] = useState('')
  const [partyStatistics, setPartyStatistics] = useState({
    electionId: '',
    data: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const selectedElection =
    elections.find((election) => election._id === selectedElectionId) ??
    elections[0]
  const chartData = partyStatistics.electionId === selectedElection?._id
    ? partyStatistics.data
    : []
  const hasVotes = chartData.some((party) => party.totalVotes > 0)

  useEffect(() => {
    if (!selectedElection?._id) {
      return undefined
    }

    let isCurrent = true
    const electionId = selectedElection._id

    async function loadStatistics() {
      setIsLoading(true)
      setError('')
      try {
        const data = await getPartyVoteStatistics(electionId)
        if (!Array.isArray(data)) {
          throw new Error(translateInEffect('The server returned invalid party vote statistics.'))
        }
        if (isCurrent) setPartyStatistics({ electionId, data })
      } catch (requestError) {
        if (isCurrent) {
          setError(translateInEffect(requestError.message || 'Could not load party vote statistics.'))
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadStatistics()
    const intervalId = selectedElection.status === 'active'
      ? window.setInterval(loadStatistics, 5000)
      : null

    return () => {
      isCurrent = false
      if (intervalId !== null) window.clearInterval(intervalId)
    }
  }, [selectedElection?._id, selectedElection?.status])

  return (
    <section aria-labelledby="party-votes-heading" className="app-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            {t('Vote distribution')}
          </p>
          <h2
            className="mt-1 text-xl font-semibold text-slate-900"
            id="party-votes-heading"
          >
            {t('Party-wise votes')}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {t('Taller bars represent parties with more votes.')}
          </p>
        </div>
        {elections.length > 0 && (
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            {t('Select election')}
            <select
              className="app-input min-w-56 rounded-lg border px-3 py-2 text-slate-900 outline-none"
              onChange={(event) => setSelectedElectionId(event.target.value)}
              value={selectedElection?._id ?? ''}
            >
              {elections.map((election) => (
                <option key={election._id} value={election._id}>
                  {election.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {!selectedElection ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-600">
          {t('Create an election to see party-wise vote statistics.')}
        </p>
      ) : isLoading && chartData.length === 0 ? (
        <div className="mt-6">
          <Loading message={t('Loading party vote statistics...')} />
        </div>
      ) : error ? (
        <p
          aria-live="polite"
          className="status-message mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : chartData.length === 0 || !hasVotes ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-600">
          {t('No votes available for this election yet.')}
        </p>
      ) : (
        <div
          aria-label={t('Party-wise vote totals for {name}', { name: selectedElection.name })}
          className="party-chart-container mt-6"
        >
          <ResponsiveContainer height="100%" minHeight={320} width="100%">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 28, right: 20, bottom: 24, left: 18 }}
            >
              <CartesianGrid
                stroke={theme === 'dark' ? '#34445a' : '#e2e8f0'}
                vertical={false}
              />
              <XAxis
                axisLine={{ stroke: theme === 'dark' ? '#526178' : '#cbd5e1' }}
                dataKey="party"
                interval={0}
                tick={{ fill: theme === 'dark' ? '#d1d9e6' : '#475569', fontSize: 12 }}
                tickLine={false}
                tickMargin={12}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                label={{
                  angle: -90,
                  fill: theme === 'dark' ? '#d1d9e6' : '#475569',
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' },
                  value: t('Total Votes'),
                }}
                tick={{ fill: theme === 'dark' ? '#9eacc1' : '#64748b', fontSize: 12 }}
                tickLine={false}
                width={56}
              />
              <Tooltip
                formatter={(value) => [value, t('Total votes')]}
                cursor={{ fill: theme === 'dark' ? '#263247' : '#f1f5f9' }}
              />
              <Bar
                dataKey="totalVotes"
                maxBarSize={72}
                radius={[7, 7, 0, 0]}
              >
                {chartData.map((party, index) => (
                  <Cell fill={getPartyColor(index)} key={party.party} />
                ))}
                <LabelList
                  dataKey="totalVotes"
                  position="top"
                  style={{
                    fill: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {selectedElection?.status === 'active' && !error && (
        <p className="mt-2 text-xs text-slate-500">
          {t('Live vote totals refresh every 5 seconds.')}
        </p>
      )}
    </section>
  )
}

export default PartyVoteChart
