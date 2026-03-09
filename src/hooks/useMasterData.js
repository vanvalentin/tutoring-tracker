import { useMemo } from 'react'
import { deriveMasterData, aggregateStatsByMonth } from '../utils/aggregations'

export function useMasterData(lessons, transportation, material, personalExpenses) {
  const masterData = useMemo(
    () => deriveMasterData(lessons, transportation, material, personalExpenses),
    [lessons, transportation, material, personalExpenses]
  )

  const stats = useMemo(
    () => aggregateStatsByMonth(lessons, transportation, material, personalExpenses),
    [lessons, transportation, material, personalExpenses]
  )

  return { masterData, stats }
}
