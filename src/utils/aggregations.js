import { STORAGE_KEYS } from '../data/schema'

const CATEGORIES = {
  LESSON_INCOME: 'Lesson Income',
  TRANSPORTATION_EXPENSE: 'Transportation Expense',
  MATERIAL_EXPENSE: 'Material Expense',
}

export function deriveMasterData(lessons, transportation, material) {
  const entries = []

  lessons.forEach((lesson, i) => {
    entries.push({
      id: `lesson-${lesson.id ?? i}`,
      date: lesson.date,
      category: CATEGORIES.LESSON_INCOME,
      amount: lesson.fee,
    })
  })

  transportation.forEach((t, i) => {
    entries.push({
      id: `transport-${t.id ?? i}`,
      date: t.date,
      category: CATEGORIES.TRANSPORTATION_EXPENSE,
      amount: -Math.abs(t.amount),
    })
  })

  material.forEach((m, i) => {
    entries.push({
      id: `material-${m.id ?? i}`,
      date: m.date,
      category: CATEGORIES.MATERIAL_EXPENSE,
      amount: -Math.abs(m.amount),
    })
  })

  return entries.sort((a, b) => new Date(a.date) - new Date(b.date))
}

export function aggregateStatsByMonth(masterData) {
  const byMonth = {}

  masterData.forEach((entry) => {
    const date = new Date(entry.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!byMonth[monthKey]) {
      byMonth[monthKey] = {
        month: monthKey,
        lessonIncome: 0,
        materialExpense: 0,
        transportationExpense: 0,
        grandTotal: 0,
      }
    }

    const row = byMonth[monthKey]

    switch (entry.category) {
      case 'Lesson Income':
        row.lessonIncome += entry.amount
        break
      case 'Material Expense':
        row.materialExpense += entry.amount
        break
      case 'Transportation Expense':
        row.transportationExpense += entry.amount
        break
      default:
        break
    }

    row.grandTotal = row.lessonIncome + row.materialExpense + row.transportationExpense
  })

  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
}
