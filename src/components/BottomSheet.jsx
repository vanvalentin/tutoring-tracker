import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function BottomSheet({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      const html = document.documentElement
      const body = document.body
      const prevHtmlOverflow = html.style.overflow
      const prevBodyOverflow = body.style.overflow
      const prevBodyOverscroll = body.style.overscrollBehavior
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
      body.style.overscrollBehavior = 'none'
      return () => {
        document.removeEventListener('keydown', handleEscape)
        html.style.overflow = prevHtmlOverflow
        body.style.overflow = prevBodyOverflow
        body.style.overscrollBehavior = prevBodyOverscroll
      }
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 min-h-screen min-h-[100dvh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottomsheet-title"
    >
      <div
        className="absolute inset-0 min-h-screen min-h-[100dvh] bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-lg flex flex-col">
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
          <h2 id="bottomsheet-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>{children}</div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
