import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../context/useLanguage.js'

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  confirmingText = 'Confirming...',
  cancelText = 'Cancel',
  isConfirming = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useLanguage()
  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onClick={onCancel}
    >
      <section
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="app-dialog app-surface w-full max-w-md p-6"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2
          className="text-lg font-semibold text-slate-900"
          id="confirm-dialog-title"
        >
          {t(title)}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t(message)}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isConfirming}
            onClick={onCancel}
            type="button"
          >
            {t(cancelText)}
          </button>
          <button
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isConfirming}
            onClick={onConfirm}
            type="button"
          >
            {t(isConfirming ? confirmingText : confirmText)}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}

export default ConfirmDialog