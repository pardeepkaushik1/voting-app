import { useState } from 'react'
import { useLanguage } from '../context/useLanguage.js'

function CandidateForm({
  candidate,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const { t } = useLanguage()
  const [name, setName] = useState(candidate?.name ?? '')
  const [party, setParty] = useState(candidate?.party ?? '')
  const [age, setAge] = useState(
    candidate?.age == null ? '' : String(candidate.age),
  )
  const [candidateImage, setCandidateImage] = useState(null)
  const [partyImage, setPartyImage] = useState(null)
  function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('party', party.trim())

    if (age !== '') {
      formData.append('age', String(Number(age)))
    }
    if (candidateImage) formData.append('candidateImage', candidateImage)
    if (partyImage) formData.append('partyImage', partyImage)

    onSubmit(formData)
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">{t('Candidate name')}</span>
        <input
          autoComplete="off"
          className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          maxLength={100}
          name="name"
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">{t('Candidate image (optional)')}</span>
        <input
          accept="image/*"
          className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          name="candidateImage"
          onChange={(event) => setCandidateImage(event.target.files?.[0] ?? null)}
          type="file"
        />
        {candidateImage?.name && (
          <span className="block text-xs text-slate-500">{candidateImage.name}</span>
        )}
        {!candidateImage && candidate?.candidateImage?.url && (
          <img
            alt={t('Candidate image preview')}
            className="h-20 w-20 rounded-full border border-slate-200 object-cover"
            src={candidate.candidateImage.url}
          />
        )}
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">{t('Party image (optional)')}</span>
        <input
          accept="image/*"
          className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          name="partyImage"
          onChange={(event) => setPartyImage(event.target.files?.[0] ?? null)}
          type="file"
        />
        {partyImage?.name && (
          <span className="block text-xs text-slate-500">{partyImage.name}</span>
        )}
        {!partyImage && candidate?.partyImage?.url && (
          <img
            alt={t('Party image preview')}
            className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
            src={candidate.partyImage.url}
          />
        )}
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">{t('Party')}</span>
        <input
          autoComplete="off"
          className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          maxLength={100}
          name="party"
          onChange={(event) => setParty(event.target.value)}
          required
          value={party}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">
          {t('Age')}{candidate ? ` (${t('optional')})` : ''}
        </span>
        <input
          className="app-input w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          min="0"
          name="age"
          onChange={(event) => setAge(event.target.value)}
          required={!candidate}
          step="1"
          type="number"
          value={age}
        />
        {candidate && (
          <span className="block text-xs text-slate-500">
            {t('Leave blank to keep the current age unchanged.')}
          </span>
        )}
      </label>

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          className="app-primary-button rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? t('Saving...')
            : candidate
              ? t('Save changes')
              : t('Add candidate')}
        </button>
        {candidate && (
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            {t('Cancel')}
          </button>
        )}
      </div>
    </form>
  )
}

export default CandidateForm