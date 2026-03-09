import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const transitResultCache = new Map()
const transitErrorCache = new Map()
const inFlightTransitRequests = new Map()
const TRANSIT_ERROR_CACHE_MS = 30_000

function buildTransitCacheKey(userId, fromStudentId, toStudentId, fromAddress, toAddress) {
  return [
    userId,
    fromStudentId,
    toStudentId,
    fromAddress.trim().toLowerCase(),
    toAddress.trim().toLowerCase(),
  ].join('::')
}

function getCachedTransitError(cacheKey) {
  const cached = transitErrorCache.get(cacheKey)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) {
    transitErrorCache.delete(cacheKey)
    return null
  }
  return cached.message
}

function cacheTransitError(cacheKey, message) {
  transitErrorCache.set(cacheKey, {
    message,
    expiresAt: Date.now() + TRANSIT_ERROR_CACHE_MS,
  })
}

function clearTransitCachesForStudent(userId, studentId) {
  for (const cacheKey of transitResultCache.keys()) {
    if (cacheKey.includes(`${userId}::${studentId}::`) || cacheKey.includes(`::${studentId}::`)) {
      transitResultCache.delete(cacheKey)
    }
  }
  for (const cacheKey of transitErrorCache.keys()) {
    if (cacheKey.includes(`${userId}::${studentId}::`) || cacheKey.includes(`::${studentId}::`)) {
      transitErrorCache.delete(cacheKey)
    }
  }
}

/**
 * Fetches and caches transit + driving time between two students.
 * Returns { data: { transitMinutes, drivingMinutes, distanceMeters }, loading, error }.
 *
 * - Cache is checked in transit_cache first (keyed by user + student pair).
 * - On cache miss, calls /api/transit (server-side Google Maps call).
 * - Cache is invalidated externally by deleting rows when a student address changes
 *   (handled in useSupabase.js student update).
 */
export function useTransitTime(fromStudentId, toStudentId, fromAddress, toAddress) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabase) return
    if (!user?.id || !fromStudentId || !toStudentId || !fromAddress?.trim() || !toAddress?.trim()) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    const cacheKey = buildTransitCacheKey(user.id, fromStudentId, toStudentId, fromAddress, toAddress)

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const memoizedResult = transitResultCache.get(cacheKey)
        if (memoizedResult && !cancelled) {
          setData(memoizedResult)
          setLoading(false)
          return
        }

        const cachedError = getCachedTransitError(cacheKey)
        if (cachedError) {
          throw new Error(cachedError)
        }

        let requestPromise = inFlightTransitRequests.get(cacheKey)
        if (!requestPromise) {
          requestPromise = (async () => {
            // Check Supabase cache first
            const { data: cached, error: cacheReadError } = await supabase
              .from('transit_cache')
              .select('transit_minutes, driving_minutes, distance_meters')
              .eq('user_id', user.id)
              .eq('from_student_id', fromStudentId)
              .eq('to_student_id', toStudentId)
              .maybeSingle()

            if (cacheReadError) {
              throw new Error(`Transit cache read failed: ${cacheReadError.message}`)
            }

            if (cached) {
              const result = {
                transitMinutes: cached.transit_minutes,
                drivingMinutes: cached.driving_minutes,
                distanceMeters: cached.distance_meters,
              }
              transitResultCache.set(cacheKey, result)
              transitErrorCache.delete(cacheKey)
              return result
            }

            // Cache miss — call the Vercel API route
            const response = await fetch('/api/transit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fromAddress, toAddress }),
            })

            if (!response.ok) {
              const err = await response.json().catch(() => ({}))
              const detail = err.detail ? ` (${err.detail})` : ''
              const providerMessage = err.providerMessage ? `: ${err.providerMessage}` : ''
              throw new Error(`${err.error || `HTTP ${response.status}`}${detail}${providerMessage}`)
            }

            const result = await response.json()
            transitResultCache.set(cacheKey, result)
            transitErrorCache.delete(cacheKey)

            // Write to cache after success so future refreshes reuse it.
            const { error: cacheWriteError } = await supabase.from('transit_cache').upsert(
              {
                user_id: user.id,
                from_student_id: fromStudentId,
                to_student_id: toStudentId,
                transit_minutes: result.transitMinutes,
                driving_minutes: result.drivingMinutes,
                distance_meters: result.distanceMeters,
                calculated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,from_student_id,to_student_id' }
            )

            if (cacheWriteError) {
              console.warn('Transit cache write failed:', cacheWriteError.message)
            }

            return result
          })().finally(() => {
            inFlightTransitRequests.delete(cacheKey)
          })
          inFlightTransitRequests.set(cacheKey, requestPromise)
        }

        const result = await requestPromise

        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      } catch (e) {
        cacheTransitError(cacheKey, e.message)
        if (!cancelled) {
          setError(e.message)
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user?.id, fromStudentId, toStudentId, fromAddress, toAddress])

  return { data, loading, error }
}

/**
 * Invalidates all transit_cache entries involving a given student.
 * Call this after updating a student's address.
 */
export async function invalidateTransitCacheForStudent(userId, studentId) {
  if (!supabase || !userId || !studentId) return
  clearTransitCachesForStudent(userId, studentId)
  await supabase
    .from('transit_cache')
    .delete()
    .eq('user_id', userId)
    .or(`from_student_id.eq.${studentId},to_student_id.eq.${studentId}`)
}
