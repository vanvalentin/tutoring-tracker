import { useLessons, useTransportation, useMaterial, usePersonalExpenses } from '../hooks/useSupabase'
import { useMasterData } from '../hooks/useMasterData'
import {
  ComposedChart,
  Bar,
  Line,
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
  const { data: personalExpenses } = usePersonalExpenses()
  const { stats } = useMasterData(lessons, transportation, material, personalExpenses)

  const chartData = stats.map((s) => ({
    month: s.month,
    lessonIncome: s.lessonIncome === 0 ? null : s.lessonIncome,
    businessExpense: s.businessExpense === 0 ? null : s.businessExpense,
    transportationExpense: s.transportationExpense === 0 ? null : s.transportationExpense,
    personalExpense: s.personalExpense === 0 ? null : s.personalExpense,
    grandTotal: s.grandTotal,
  }))

  const totals = stats.reduce(
    (acc, s) => ({
      lessonIncome: acc.lessonIncome + s.lessonIncome,
      businessExpense: acc.businessExpense + s.businessExpense,
      transportationExpense: acc.transportationExpense + s.transportationExpense,
      personalExpense: acc.personalExpense + s.personalExpense,
      grandTotal: acc.grandTotal + s.grandTotal,
    }),
    { lessonIncome: 0, businessExpense: 0, transportationExpense: 0, personalExpense: 0, grandTotal: 0 }
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Stats</h2>
      <p className="text-sm text-gray-600">
        Monthly financial summary across lesson income and all expense categories.
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-700 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Date (Year-Month)</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Lesson Income</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Business Expenses</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Transportation Expense</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Personal Expenses</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Grand Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {stats.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No data yet. Add lessons, transportation, business expenses, or personal expenses in their respective tabs.
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
                    <td className="px-4 py-3 text-right text-sm text-red-700">{row.businessExpense}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-700">{row.transportationExpense}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-700">{row.personalExpense}</td>
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
                    <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                    <td className="px-4 py-3 text-right text-sm text-green-700">{totals.lessonIncome}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-700">{totals.businessExpense}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-700">{totals.transportationExpense}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-700">{totals.personalExpense}</td>
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
          <h3 className="mb-4 text-lg font-medium text-gray-900">Grand Total per month</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [`${value} HKD`, name]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="lessonIncome" name="Lesson Income" fill="#16a34a" />
                <Bar dataKey="businessExpense" name="Business Expenses" fill="#475569" stackId="expense" />
                <Bar dataKey="transportationExpense" name="Transportation Expense" fill="#dc2626" stackId="expense" />
                <Bar dataKey="personalExpense" name="Personal Expenses" fill="#7c3aed" stackId="expense" />
                <Line type="monotone" dataKey="grandTotal" name="Grand Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
