import { useLanguage } from '../context/useLanguage.js'

function Loading({ message = 'Loading...' }) {
  const { t } = useLanguage()
  return (
    <div
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-slate-600"
      role="status"
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
      />
      <span>{t(message)}</span>
    </div>
  )
}

export default Loading