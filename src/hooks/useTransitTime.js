import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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

    async function load() {
      setLoading(true)
      setError(null)

      try {
        // Check Supabase cache first
        const { data: cached } = await supabase
          .from('transit_cache')
          .select('transit_minutes, driving_minutes, distance_meters')
          .eq('user_id', user.id)
          .eq('from_student_id', fromStudentId)
          .eq('to_student_id', toStudentId)
          .maybeSingle()

        if (cached && !cancelled) {
          setData({
            transitMinutes: cached.transit_minutes,
            drivingMinutes: cached.driving_minutes,
            distanceMeters: cached.distance_meters,
          })
          setLoading(false)
          return
        }

        // Cache miss — call the Vercel API route
        const response = await fetch('/api/transit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromAddress, toAddress }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || `HTTP ${response.status}`)
        }

        const result = await response.json()

        // Write to cache (upsert in case a race condition inserted it)
        await supabase.from('transit_cache').upsert(
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

        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      } catch (e) {
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
  await supabase
    .from('transit_cache')
    .delete()
    .eq('user_id', userId)
    .or(`from_student_id.eq.${studentId},to_student_id.eq.${studentId}`)
}
