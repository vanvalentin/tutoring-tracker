import { useLessons, useTransportation, useMaterial } from '../hooks/useSupabase'
import { useMasterData } from '../hooks/useMasterData'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

export default function StatsPage() {
  const { data: lessons } = useLessons()
  const { data: transportation } = useTransportation()
  const { data: material } = useMaterial()
  const { stats } = useMasterData(lessons, transportation, material)

  const chartData = stats.map((s) => ({
    month: s.month,
    lessonIncome: s.lessonIncome,
    materialExpense: s.materialExpense,
    transportationExpense: s.transportationExpense,
    grandTotal: s.grandTotal,
  }))

  const totals = stats.reduce(
    (acc, s) => ({
      lessonIncome: acc.lessonIncome + s.lessonIncome,
      materialExpense: acc.materialExpense + s.materialExpense,
      transportationExpense: acc.transportationExpense + s.transportationExpense,
      grandTotal: acc.grandTotal + s.grandTotal,
    }),
    { lessonIncome: 0, materialExpense: 0, transportationExpense: 0, grandTotal: 0 }
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Stats</h2>
      <p className="text-sm text-gray-600">
        Monthly financial summary by category.
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-700 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Date (Year-Month)</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Lesson Income</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Material Expense</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Transportation Expense</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Grand Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {stats.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No data yet. Add lessons, transportation, or material entries in their respective tabs.
                </td>
              </tr>
            ) : (
              <>
                {stats.map((row, index) => (
                  <tr
                    key={row.month}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.month}</td>
                    <td className="px-4 py-3 text-right text-sm text-green-700">{row.lessonIncome}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-700">{row.materialExpense}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-700">{row.transportationExpense}</td>
                    <td
                      className={`px-4 py-3 text-right text-sm font-medium ${
                        row.grandTotal >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {row.grandTotal}
                    </td>
                  </tr>
                ))}
                {stats.length >= 1 && (
                  <tr className="border-t-2 border-gray-300 bg-slate-100 font-semibold">
                    <td className="px-4 py-3 text-sm text-gray-900">Grand Total</td>
                    <td className="px-4 py-3 text-right text-sm text-green-700">{totals.lessonIncome}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-700">{totals.materialExpense}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-700">{totals.transportationExpense}</td>
                    <td
                      className={`px-4 py-3 text-right text-sm ${
                        totals.grandTotal >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {totals.grandTotal}
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Revenue per month</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [`${value} HKD`, name]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="lessonIncome" name="Lesson Income" fill="#f97316" />
                <Bar dataKey="materialExpense" name="Material Expense" fill="#22c55e" />
                <Bar dataKey="transportationExpense" name="Transportation Expense" fill="#b91c1c" />
                <Bar dataKey="grandTotal" name="Grand Total" fill="#3b82f6" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
