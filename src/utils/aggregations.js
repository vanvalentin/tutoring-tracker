const CATEGORIES = {
  LESSON_INCOME: 'Lesson Income',
  TRANSPORTATION_EXPENSE: 'Transportation Expense',
  BUSINESS_EXPENSE: 'Business Expense',
  PERSONAL_EXPENSE: 'Personal Expense',
}

export function deriveMasterData(lessons, transportation, material, personalExpenses = []) {
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
      category: CATEGORIES.BUSINESS_EXPENSE,
      amount: -Math.abs(m.amount),
    })
  })

  personalExpenses.forEach((expense, i) => {
    entries.push({
      id: `personal-expense-${expense.id ?? i}`,
      date: expense.date,
      category: CATEGORIES.PERSONAL_EXPENSE,
      amount: -Math.abs(expense.amount),
    })
  })

  return entries.sort((a, b) => new Date(a.date) - new Date(b.date))
}

function monthKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function createMonthRow(key) {
  return {
    month: key,
    lessonIncome: 0,
    businessExpense: 0,
    transportationExpense: 0,
    personalExpense: 0,
    grandTotal: 0,
  }
}

export function aggregateStatsByMonth(lessons, transportation, material, personalExpenses = []) {
  const byMonth = {}

  lessons.forEach((lesson) => {
    if (lesson.status === 'canceled') return
    const key = monthKey(lesson.date)
    if (!byMonth[key]) {
      byMonth[key] = createMonthRow(key)
    }
    byMonth[key].lessonIncome += Number(lesson.fee) || 0
  })

  ;[].concat(transportation || []).forEach((t) => {
    const key = monthKey(t.date)
    if (!byMonth[key]) {
      byMonth[key] = createMonthRow(key)
    }
    byMonth[key].transportationExpense += -Math.abs(Number(t.amount) || 0)
  })

  ;[].concat(material || []).forEach((m) => {
    const key = monthKey(m.date)
    if (!byMonth[key]) {
      byMonth[key] = createMonthRow(key)
    }
    byMonth[key].businessExpense += -Math.abs(Number(m.amount) || 0)
  })

  ;[].concat(personalExpenses || []).forEach((expense) => {
    const key = monthKey(expense.date)
    if (!byMonth[key]) {
      byMonth[key] = createMonthRow(key)
    }
    byMonth[key].personalExpense += -Math.abs(Number(expense.amount) || 0)
  })

  Object.values(byMonth).forEach((row) => {
    row.grandTotal =
      row.lessonIncome +
      row.businessExpense +
      row.transportationExpense +
      row.personalExpense
  })

  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
}
