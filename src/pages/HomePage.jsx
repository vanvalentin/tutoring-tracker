import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLessons } from '../hooks/useSupabase'

const QUICK_ADD_BUTTONS = [
  { path: '/lessons', label: 'Add Lesson', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { path: '/transportation', label: 'Add Transport', icon: 'M8 17a2 2 0 11-4 0 2 2 0 014 0zM16 17a2 2 0 11-4 0 2 2 0 014 0zM5 11l1.5-4.5h11L19 11v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z' },
  { path: '/material', label: 'Add Material', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { path: '/students', label: 'Add Student', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
]

function formatMonth(date) {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export default function HomePage() {
  const navigate = useNavigate()
  const { data: lessons, loading } = useLessons()

  const { currentMonthRevenue, pendingCount } = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    let revenue = 0
    let pending = 0

    lessons.forEach((l) => {
      const d = new Date(l.date)
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        revenue += l.fee ?? 0
        // Only count unpaid lessons that have already happened (date in the past)
        if (!l.paid && l.date < todayStr) pending += 1
      }
    })

    return {
      currentMonthRevenue: revenue,
      pendingCount: pending,
    }
  }, [lessons])

  const monthLabel = formatMonth(new Date())

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">Overview for {monthLabel}</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Current month revenue</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                HKD {currentMonthRevenue.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">{monthLabel}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Lesson payments pending</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{pendingCount}</p>
              <p className="mt-0.5 text-xs text-gray-400">Unpaid this month</p>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-medium text-gray-700">Quick add</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_ADD_BUTTONS.map(({ path, label, icon }) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(`${path}?add=1`)}
                  className="flex min-h-[72px] items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-gray-50 hover:border-gray-300 sm:flex-col"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                  </span>
                  <span className="text-center text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
