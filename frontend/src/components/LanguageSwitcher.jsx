import { useLanguage } from '../context/useLanguage.js'

function LanguageSwitcher() {
  const { language, toggleLanguage, t } = useLanguage()

  return (
    <button
      aria-label={t(language === 'en' ? 'Switch to Hindi' : 'Switch to English')}
      className="fixed bottom-5 left-5 z-40 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg hover:bg-slate-50"
      onClick={toggleLanguage}
      type="button"
    >
      {language === 'en' ? 'हिन्दी' : 'English'}
    </button>
  )
}

export default LanguageSwitcher
