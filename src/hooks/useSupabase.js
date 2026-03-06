import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { invalidateTransitCacheForStudent } from './useTransitTime'

// Map DB column names (snake_case) to app (camelCase)
function toAppStudent(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    address: row.address,
    goal: row.goal,
    paymentMethod: row.payment_method,
    defaultDuration: row.default_duration ?? null,
    notes: row.notes,
    active: row.active ?? true,
  }
}

function toAppFee(row) {
  if (!row) return null
  return {
    id: row.id,
    duration: row.duration,
    fee: parseFloat(row.fee),
    description: row.description,
  }
}

function toAppLesson(row) {
  if (!row) return null
  return {
    id: row.id,
    date: row.date,
    time: row.time ?? null,
    studentId: row.student_id,
    duration: row.duration,
    fee: parseFloat(row.fee),
    paid: row.paid ?? false,
    notes: row.notes,
    status: row.status ?? 'scheduled',
  }
}

function toAppTransportation(row) {
  if (!row) return null
  return {
    id: row.id,
    date: row.date,
    amount: parseFloat(row.amount),
    type: row.type,
    destination: row.destination,
    note: row.note,
  }
}

function toAppMaterial(row) {
  if (!row) return null
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    amount: parseFloat(row.amount),
    vendor: row.vendor,
    paidByParent: row.paid_by_parent ?? false,
    note: row.note,
  }
}

export function useStudents() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data: rows, error: err } = await supabase
        .from('students')
        .select('*')
        .order('name')
      if (err) throw err
      setData((rows || []).map(toAppStudent))
    } catch (e) {
      setError(e.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetch()
  }, [fetch])

  const add = useCallback(
    async (student) => {
      const { data: row, error: err } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
          name: student.name,
          location: student.location,
          address: student.address,
          goal: student.goal,
          payment_method: student.paymentMethod,
          default_duration: (student.defaultDuration && student.defaultDuration.trim()) || null,
          notes: student.notes,
          active: student.active ?? true,
        })
        .select()
        .single()
      if (err) throw err
      const appStudent = toAppStudent(row)
      setData((prev) => [...prev, appStudent])
      return appStudent
    },
    [user?.id]
  )

  const update = useCallback(async (id, updates) => {
    const { data: row, error: err } = await supabase
      .from('students')
      .update({
        name: updates.name,
        location: updates.location,
        address: updates.address,
        goal: updates.goal,
        payment_method: updates.paymentMethod,
        default_duration: (updates.defaultDuration && updates.defaultDuration.trim()) || null,
        notes: updates.notes,
        active: updates.active ?? true,
      })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    const appStudent = toAppStudent(row)
    setData((prev) => prev.map((s) => (s.id === id ? appStudent : s)))
    // Invalidate transit cache since address may have changed
    invalidateTransitCacheForStudent(user?.id, id)
    return appStudent
  }, [user?.id])

  const remove = useCallback(async (id) => {
    await supabase.from('students').delete().eq('id', id)
    setData((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return { data, loading, error, refetch: fetch, add, update, remove }
}

export function useFees() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data: rows, error: err } = await supabase
        .from('fees')
        .select('*')
        .order('fee')
      if (err) throw err
      setData((rows || []).map(toAppFee))
    } catch (e) {
      setError(e.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetch()
  }, [fetch])

  const add = useCallback(
    async (fee) => {
      const { data: row, error: err } = await supabase
        .from('fees')
        .insert({
          user_id: user.id,
          duration: fee.duration,
          fee: fee.fee,
          description: fee.description,
        })
        .select()
        .single()
      if (err) throw err
      const appFee = toAppFee(row)
      setData((prev) => [...prev, appFee])
      return appFee
    },
    [user?.id]
  )

  const update = useCallback(async (id, updates) => {
    const { data: row, error: err } = await supabase
      .from('fees')
      .update({
        duration: updates.duration,
        fee: updates.fee,
        description: updates.description,
      })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    const appFee = toAppFee(row)
    setData((prev) => prev.map((f) => (f.id === id ? appFee : f)))
    return appFee
  }, [])

  const remove = useCallback(async (id) => {
    await supabase.from('fees').delete().eq('id', id)
    setData((prev) => prev.filter((f) => f.id !== id))
  }, [])

  return { data, loading, error, refetch: fetch, add, update, remove }
}

export function useLessons() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data: rows, error: err } = await supabase
        .from('lessons')
        .select('*')
        .order('date', { ascending: false })
      if (err) throw err
      setData((rows || []).map(toAppLesson))
    } catch (e) {
      setError(e.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetch()
  }, [fetch])

  const add = useCallback(
    async (lesson) => {
      const insertRow = {
        user_id: user.id,
        date: lesson.date,
        student_id: lesson.studentId,
        duration: lesson.duration,
        fee: lesson.fee,
        paid: lesson.paid ?? false,
        notes: lesson.notes,
        status: lesson.status ?? 'scheduled',
      }
      if (lesson.time) insertRow.time = lesson.time
      const { data: row, error: err } = await supabase
        .from('lessons')
        .insert(insertRow)
        .select()
        .single()
      if (err) throw err
      const appLesson = toAppLesson(row)
      setData((prev) => [appLesson, ...prev])
      return appLesson
    },
    [user?.id]
  )

  const addMany = useCallback(
    async (lessons) => {
      if (!lessons.length) return []
      const rows = lessons.map((lesson) => {
        const row = {
          user_id: user.id,
          date: lesson.date,
          student_id: lesson.studentId,
          duration: lesson.duration,
          fee: lesson.fee,
          paid: lesson.paid ?? false,
          notes: lesson.notes ?? '',
          status: lesson.status ?? 'scheduled',
        }
        if (lesson.time) row.time = lesson.time
        return row
      })
      const { data: inserted, error: err } = await supabase
        .from('lessons')
        .insert(rows)
        .select()
      if (err) throw err
      const appLessons = (inserted || []).map(toAppLesson)
      setData((prev) => [...appLessons, ...prev])
      return appLessons
    },
    [user?.id]
  )

  const update = useCallback(async (id, updates) => {
    const dbUpdates = {}
    if (updates.paid !== undefined) dbUpdates.paid = updates.paid
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.time !== undefined) dbUpdates.time = updates.time
    if (updates.studentId !== undefined) dbUpdates.student_id = updates.studentId
    if (updates.duration !== undefined) dbUpdates.duration = updates.duration
    if (updates.fee !== undefined) dbUpdates.fee = updates.fee
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.status !== undefined) dbUpdates.status = updates.status
    const { data: row, error: err } = await supabase
      .from('lessons')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    const appLesson = toAppLesson(row)
    setData((prev) => prev.map((l) => (l.id === id ? appLesson : l)))
    return appLesson
  }, [])

  const remove = useCallback(async (id) => {
    await supabase.from('lessons').delete().eq('id', id)
    setData((prev) => prev.filter((l) => l.id !== id))
  }, [])

  return { data, loading, error, refetch: fetch, add, addMany, update, remove }
}

export function useTransportation() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data: rows, error: err } = await supabase
        .from('transportation')
        .select('*')
        .order('date', { ascending: false })
      if (err) throw err
      setData((rows || []).map(toAppTransportation))
    } catch (e) {
      setError(e.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetch()
  }, [fetch])

  const add = useCallback(
    async (t) => {
      const { data: row, error: err } = await supabase
        .from('transportation')
        .insert({
          user_id: user.id,
          date: t.date,
          amount: t.amount,
          type: t.type,
          destination: t.destination,
          note: t.note,
        })
        .select()
        .single()
      if (err) throw err
      const appT = toAppTransportation(row)
      setData((prev) => [appT, ...prev])
      return appT
    },
    [user?.id]
  )

  const update = useCallback(async (id, updates) => {
    const dbUpdates = {}
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.destination !== undefined) dbUpdates.destination = updates.destination
    if (updates.note !== undefined) dbUpdates.note = updates.note
    const { data: row, error: err } = await supabase
      .from('transportation')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    const appT = toAppTransportation(row)
    setData((prev) => prev.map((x) => (x.id === id ? appT : x)))
    return appT
  }, [])

  const remove = useCallback(async (id) => {
    await supabase.from('transportation').delete().eq('id', id)
    setData((prev) => prev.filter((x) => x.id !== id))
  }, [])

  return { data, loading, error, refetch: fetch, add, update, remove }
}

export function useMaterial() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data: rows, error: err } = await supabase
        .from('material')
        .select('*')
        .order('date', { ascending: false })
      if (err) throw err
      setData((rows || []).map(toAppMaterial))
    } catch (e) {
      setError(e.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetch()
  }, [fetch])

  const add = useCallback(
    async (m) => {
      const { data: row, error: err } = await supabase
        .from('material')
        .insert({
          user_id: user.id,
          date: m.date,
          description: m.description,
          amount: m.amount,
          vendor: m.vendor,
          paid_by_parent: m.paidByParent ?? false,
          note: m.note,
        })
        .select()
        .single()
      if (err) throw err
      const appM = toAppMaterial(row)
      setData((prev) => [appM, ...prev])
      return appM
    },
    [user?.id]
  )

  const update = useCallback(async (id, updates) => {
    const dbUpdates = {}
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount
    if (updates.vendor !== undefined) dbUpdates.vendor = updates.vendor
    if (updates.paidByParent !== undefined) dbUpdates.paid_by_parent = updates.paidByParent
    if (updates.note !== undefined) dbUpdates.note = updates.note
    const { data: row, error: err } = await supabase
      .from('material')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    const appM = toAppMaterial(row)
    setData((prev) => prev.map((x) => (x.id === id ? appM : x)))
    return appM
  }, [])

  const remove = useCallback(async (id) => {
    await supabase.from('material').delete().eq('id', id)
    setData((prev) => prev.filter((x) => x.id !== id))
  }, [])

  return { data, loading, error, refetch: fetch, add, update, remove }
}
