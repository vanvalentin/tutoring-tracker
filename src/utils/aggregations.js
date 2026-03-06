import { STORAGE_KEYS } from '../data/schema'

const CATEGORIES = {
  LESSON_INCOME: 'Lesson Income',
  TRANSPORTATION_EXPENSE: 'Transportation Expense',
  MATERIAL_EXPENSE: 'Material Expense',
}

export function deriveMasterData(lessons, transportation, material) {
  const entries = []

  lessons.forEach((lesson, i) => {
    if (lesson.status === 'canceled') return
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

function monthKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function aggregateStatsByMonth(lessons, transportation, material) {
  const byMonth = {}

  lessons.forEach((lesson) => {
    if (lesson.status === 'canceled') return
    const key = monthKey(lesson.date)
    if (!byMonth[key]) {
      byMonth[key] = {
        month: key,
        lessonIncome: 0,
        materialExpense: 0,
        transportationExpense: 0,
        grandTotal: 0,
      }
    }
    byMonth[key].lessonIncome += Number(lesson.fee) || 0
  })

  ;[].concat(transportation || []).forEach((t) => {
    const key = monthKey(t.date)
    if (!byMonth[key]) {
      byMonth[key] = {
        month: key,
        lessonIncome: 0,
        materialExpense: 0,
        transportationExpense: 0,
        grandTotal: 0,
      }
    }
    byMonth[key].transportationExpense += -Math.abs(Number(t.amount) || 0)
  })

  ;[].concat(material || []).forEach((m) => {
    const key = monthKey(m.date)
    if (!byMonth[key]) {
      byMonth[key] = {
        month: key,
        lessonIncome: 0,
        materialExpense: 0,
        transportationExpense: 0,
        grandTotal: 0,
      }
    }
    byMonth[key].materialExpense += -Math.abs(Number(m.amount) || 0)
  })

  Object.values(byMonth).forEach((row) => {
    row.grandTotal = row.lessonIncome + row.materialExpense + row.transportationExpense
  })

  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
}
