import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BottomSheet from './BottomSheet'

const tabs = [
  { path: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/lessons', label: 'Lessons', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { path: '/transportation', label: 'Transportation', icon: 'M8 17a2 2 0 11-4 0 2 2 0 014 0zM16 17a2 2 0 11-4 0 2 2 0 014 0zM5 11l1.5-4.5h11L19 11v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z' },
  { path: '/material', label: 'Material', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { path: '/stats', label: 'Stats', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/master-data', label: 'Master Data', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
  { path: '/fees', label: 'Fees', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: '/students', label: 'Students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
]

const mobileNavItems = [
  { path: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/lessons', label: 'Lessons', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { path: '/transportation', label: 'Transport', icon: 'M8 17a2 2 0 11-4 0 2 2 0 014 0zM16 17a2 2 0 11-4 0 2 2 0 014 0zM5 11l1.5-4.5h11L19 11v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z' },
  { path: '/material', label: 'Material', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
]

const moreNavItems = [
  { path: '/stats', label: 'Stats' },
  { path: '/master-data', label: 'Master Data' },
  { path: '/fees', label: 'Fees' },
  { path: '/students', label: 'Students' },
]

const quickAddOptions = [
  { path: '/lessons', label: 'Lesson', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { path: '/transportation', label: 'Transport', icon: 'M8 17a2 2 0 11-4 0 2 2 0 014 0zM16 17a2 2 0 11-4 0 2 2 0 014 0zM5 11l1.5-4.5h11L19 11v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z' },
  { path: '/material', label: 'Material', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
]

function NavIcon({ path }) {
  const tab = tabs.find((t) => t.path === path)
  if (!tab?.icon) return null
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
    </svg>
  )
}

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isMoreActive = moreNavItems.some(({ path }) => location.pathname === path)
  const [menuOpen, setMenuOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'User'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 text-sm font-medium text-white">
                T
              </div>
              <span className="text-lg font-semibold text-gray-800">Tutoring Tracker</span>
            </div>

            {/* Nav links */}
            <div className="hidden flex-1 justify-center gap-1 md:flex">
              {tabs.map(({ path, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-gray-800 text-gray-900'
                        : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                    }`
                  }
                >
                  <NavIcon path={path} />
                  {label}
                </NavLink>
              ))}
            </div>

            {/* User profile */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition-colors hover:bg-gray-50"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
                  {initials}
                </div>
                <span className="hidden max-w-[100px] truncate text-sm text-gray-700 sm:inline">
                  {displayName}
                </span>
                <svg
                  className={`h-4 w-4 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden="true"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <div className="border-b border-gray-100 px-3 py-2 text-sm text-gray-700">
                      {displayName}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        signOut()
                        setMenuOpen(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-gray-200 bg-white/95 px-2 pb-4 pt-2 backdrop-blur md:hidden" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {mobileNavItems.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-gray-900' : 'text-gray-500'
              }`
            }
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
            {label}
          </NavLink>
        ))}

        {/* Center + button with radial quick-add */}
        <div className="relative -mt-6 flex h-14 w-14 items-center justify-center">
          {quickAddOpen && (
            <>
              <div
                className="fixed inset-0 z-30 md:hidden"
                aria-hidden="true"
                onClick={() => setQuickAddOpen(false)}
              />
              {quickAddOptions.map(({ path, label, icon }, i) => {
                const angles = [-150, -90, -30]
                const angle = angles[i] * (Math.PI / 180)
                const r = 56
                const x = Math.cos(angle) * r
                const y = Math.sin(angle) * r
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => {
                      setQuickAddOpen(false)
                      navigate(`${path}?add=1`)
                    }}
                    className="absolute z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg ring-1 ring-gray-200 transition-transform hover:bg-gray-50 active:scale-95"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                    title={label}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                  </button>
                )
              })}
            </>
          )}
          <button
            type="button"
            onClick={() => setQuickAddOpen(!quickAddOpen)}
            className={`relative z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
              quickAddOpen ? 'bg-gray-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            aria-label="Quick add"
            aria-expanded={quickAddOpen}
          >
            <svg
              className={`h-7 w-7 text-white transition-transform ${quickAddOpen ? 'rotate-45' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* More - opens sheet */}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${isMoreActive ? 'text-gray-900' : 'text-gray-500'}`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          More
        </button>
      </nav>

      {/* More sheet */}
      <BottomSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="space-y-1">
          {moreNavItems.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMoreOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
            >
              {label}
            </NavLink>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
