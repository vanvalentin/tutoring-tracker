import { useLessons, useTransportation, useMaterial } from '../hooks/useSupabase'
import { useMasterData } from '../hooks/useMasterData'
import SortableTable from '../components/SortableTable'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const COLUMNS = [
  { key: 'date', label: 'Date', cell: (val) => formatDate(val) },
  { key: 'category', label: 'Category' },
  {
    key: 'amount',
    label: 'Amount',
    cell: (val) => (
      <span className={val >= 0 ? 'text-green-700' : 'text-red-700'}>
        {val >= 0 ? '+' : ''}{val}
      </span>
    ),
  },
]

export default function MasterDataPage() {
  const { data: lessons } = useLessons()
  const { data: transportation } = useTransportation()
  const { data: material } = useMaterial()
  const { masterData } = useMasterData(lessons, transportation, material)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Master Data</h2>
      <p className="text-sm text-gray-600">
        Consolidated transaction log derived from Lessons, Transportation, and Material entries.
      </p>

      <SortableTable
        columns={COLUMNS}
        data={masterData}
        emptyMessage="No transactions yet. Add lessons, transportation, or material entries in their respective tabs."
        searchPlaceholder="Search by date, category, amount..."
        cardTitleKey="category"
      />
    </div>
  )
}
