import { useMemo } from 'react'
import { deriveMasterData, aggregateStatsByMonth } from '../utils/aggregations'

export function useMasterData(lessons, transportation, material) {
  const masterData = useMemo(
    () => deriveMasterData(lessons, transportation, material),
    [lessons, transportation, material]
  )

  const stats = useMemo(
    () => aggregateStatsByMonth(masterData),
    [masterData]
  )

  return { masterData, stats }
}
