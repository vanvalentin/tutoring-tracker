import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  TextField,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { useStudents, useFees, useLessons } from '../hooks/useSupabase'
import { isHoliday } from '../utils/hkHolidays'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import TimePickerInput from '../components/TimePickerInput'
import SortableTable from '../components/SortableTable'
import StatusBadge from '../components/StatusBadge'
import TransitInfo from '../components/TransitInfo'

const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
]

/** Convert "HH:MM" to total minutes from midnight */
function timeToMinutes(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Parse duration strings like "1 hour", "1.5 hours", "90 minutes" into minutes */
function parseDurationMinutes(durationStr) {
  if (!durationStr) return 0
  const match = durationStr.match(/(\d+(?:[.,]\d+)?)\s*(h(?:our|r)?s?|m(?:in(?:ute)?s?)?)/i)
  if (!match) return 0
  const num = parseFloat(match[1].replace(',', '.'))
  const unit = match[2].toLowerCase()
  return unit.startsWith('h') ? Math.round(num * 60) : Math.round(num)
}

/**
 * Minutes between end of prevLesson and start of currLesson.
 * Returns null if either has no time recorded.
 */
function getGapMinutes(prevLesson, currLesson) {
  const prevStart = timeToMinutes(prevLesson.time)
  const currStart = timeToMinutes(currLesson.time)
  if (prevStart == null || currStart == null) return null
  const prevEnd = prevStart + parseDurationMinutes(prevLesson.duration)
  return currStart - prevEnd
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  const [h, m] = timeStr.split(':')
  return `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`
}

/** Get all dates in a month that fall on the given weekday (0=Sun, 1=Mon, ..., 6=Sat) */
function getDatesForWeekdayInMonth(weekday, year, month) {
  const dates = []
  const d = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0).getDate()
  for (let day = 1; day <= lastDay; day++) {
    d.setDate(day)
    if (d.getDay() === weekday) {
      dates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    }
  }
  return dates
}

const COLUMNS = [
  { key: 'date', label: 'Date', cell: (val) => formatDate(val) },
  { key: 'time', label: 'Time', cell: (val) => formatTime(val) },
  {
    key: 'studentName',
    label: 'Student',
    accessorFn: (row) => row._studentName ?? '',
    cell: (_, row) => (
      <div className="flex items-center gap-1">
        <span>{row._studentName ?? '-'}</span>
        {row._student && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              row._onShowStudent?.(row._student)
            }}
            sx={{ p: 0.25 }}
            aria-label="View student details"
          >
            <InfoOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </div>
    ),
  },
  { key: 'duration', label: 'Duration' },
  { key: 'fee', label: 'Fee (HKD)' },
  {
    key: 'paid',
    label: 'Status',
    cell: (val, row) => {
      if (row.status === 'canceled') {
        return (
          <StatusBadge variant="canceled">Canceled</StatusBadge>
        )
      }
      return (
        <div className="flex items-center gap-2">
          <StatusBadge variant={val ? 'success' : 'neutral'}>
            {val ? 'Paid' : 'Unpaid'}
          </StatusBadge>
          <Checkbox
            size="small"
            checked={val ?? false}
            onChange={() => row._onTogglePaid?.(row)}
          />
        </div>
      )
    },
  },
  { key: 'notes', label: 'Notes' },
]

const resetFormData = (mode = 'recurring') => ({
  mode,
  date: new Date().toISOString().slice(0, 10),
  time: '',
  weekday: 1,
  monthYear: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  studentId: '',
  duration: '',
  fee: '',
  paid: false,
  notes: '',
})

export default function LessonsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: students } = useStudents()
  const { data: fees } = useFees()
  const { data: lessons, loading, error, add, addMany, update, remove } = useLessons()
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState(resetFormData)
  const [editingLessonIndex, setEditingLessonIndex] = useState(null)
  const [editingLesson, setEditingLesson] = useState(null)
  const [quickFilter, setQuickFilter] = useState(null)
  const [studentPopupStudent, setStudentPopupStudent] = useState(null)

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('add')
        return next
      }, { replace: true })
      setFormData(resetFormData())
      setModalOpen(true)
    }
  }, [searchParams])

  const filterFromUrl = searchParams.get('filter')
  useEffect(() => {
    if (filterFromUrl === 'pending' || filterFromUrl === 'today' || filterFromUrl === 'month') {
      setQuickFilter(filterFromUrl)
    } else if (filterFromUrl === null || filterFromUrl === '') {
      setQuickFilter(null)
    }
  }, [filterFromUrl])

  const activeStudents = students.filter((s) => s.active !== false)

  const handleDurationChange = (duration) => {
    const feeEntry = fees.find((f) => f.duration === duration)
    setFormData({
      ...formData,
      duration,
      fee: feeEntry ? String(feeEntry.fee) : '',
    })
  }

  const recurringDates = useMemo(() => {
    if (formData.mode !== 'recurring' || !formData.monthYear) return []
    const [year, month] = formData.monthYear.split('-').map(Number)
    return getDatesForWeekdayInMonth(Number(formData.weekday), year, month)
  }, [formData.mode, formData.monthYear, formData.weekday])

  const [confirmStep, setConfirmStep] = useState('form')
  const [pendingLessons, setPendingLessons] = useState([])
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState(null)
  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState(null)

  const handleProceedToConfirm = (e) => {
    e.preventDefault()
    const feeNum = parseFloat(formData.fee)
    if (!formData.studentId || !formData.duration || isNaN(feeNum)) return
    if (formData.mode === 'recurring' && recurringDates.length === 0) return

    if (formData.mode === 'single') {
      setPendingLessons([
        {
          date: formData.date,
          time: formData.time || '',
          studentId: formData.studentId,
          duration: formData.duration,
          fee: feeNum,
          paid: formData.paid,
          notes: formData.notes,
        },
      ])
    } else {
      setPendingLessons(
        recurringDates.map((date) => ({
          date,
          time: formData.time || '',
          studentId: formData.studentId,
          duration: formData.duration,
          fee: feeNum,
          paid: false,
          notes: formData.notes,
        }))
      )
    }
    setConfirmStep('confirm')
  }

  const updatePendingLesson = (index, updates) => {
    setPendingLessons((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...updates } : l))
    )
  }

  const removePendingLesson = (index) => {
    setPendingLessons((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConfirmSubmit = async () => {
    if (pendingLessons.length === 0) return
    try {
      if (pendingLessons.length === 1) {
        const l = pendingLessons[0]
        await add({
          date: l.date,
          time: l.time || undefined,
          studentId: l.studentId,
          duration: l.duration,
          fee: l.fee,
          paid: l.paid,
          notes: l.notes,
        })
      } else {
        await addMany(
          pendingLessons.map((l) => ({
            date: l.date,
            time: l.time || undefined,
            studentId: l.studentId,
            duration: l.duration,
            fee: l.fee,
            paid: l.paid,
            notes: l.notes,
          }))
        )
      }
      setFormData(resetFormData(formData.mode))
      setConfirmStep('form')
      setPendingLessons([])
      setModalOpen(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleBackToForm = () => {
    setConfirmStep('form')
    setPendingLessons([])
    setEditingLessonIndex(null)
  }

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson)
    setModalOpen(true)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingLesson) return
    const feeNum = parseFloat(editingLesson.fee)
    if (!editingLesson.studentId || !editingLesson.duration || isNaN(feeNum)) return
    try {
      await update(editingLesson.id, {
        date: editingLesson.date,
        time: editingLesson.time || undefined,
        studentId: editingLesson.studentId,
        duration: editingLesson.duration,
        fee: feeNum,
        notes: editingLesson.notes ?? '',
      })
      setEditingLesson(null)
      setModalOpen(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const updateEditingLesson = (updates) => {
    setEditingLesson((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const handleTogglePaid = async (lesson) => {
    try {
      await update(lesson.id, { paid: !lesson.paid })
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCancel = async (lesson) => {
    try {
      await update(lesson.id, { status: 'canceled' })
    } catch (err) {
      alert(err.message)
    }
  }

  const handleRestore = async (lesson) => {
    try {
      await update(lesson.id, { status: 'scheduled' })
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await remove(id)
      setConfirmDeleteLesson(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const getStudentName = (studentId) =>
    students.find((s) => s.id === studentId)?.name ?? ''

  const getStudent = (studentId) =>
    students.find((s) => s.id === studentId) ?? null

  const tableData = lessons
    .slice()
    .sort((a, b) => {
      // Primary: date descending
      if (a.date > b.date) return -1
      if (a.date < b.date) return 1
      // Secondary within same date: time ascending (nulls last)
      if (!a.time && !b.time) return 0
      if (!a.time) return 1
      if (!b.time) return -1
      return a.time.localeCompare(b.time)
    })
    .map((l) => ({
      ...l,
      _studentName: getStudentName(l.studentId),
      _student: getStudent(l.studentId),
      _onTogglePaid: handleTogglePaid,
      _onShowStudent: setStudentPopupStudent,
    }))

  const isCanceled = (row) => row.status === 'canceled'
  const todayStr = dayjs().format('YYYY-MM-DD')
  const isTodayLesson = (row) => (row.date ?? '') === todayStr
  const isPastLesson = (row) => (row.date ?? '') < todayStr

  const filteredTableData = useMemo(() => {
    if (!quickFilter) return tableData
    const today = dayjs().format('YYYY-MM-DD')
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD')
    const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD')

    return tableData.filter((row) => {
      const date = row.date ?? ''
      switch (quickFilter) {
        case 'today':
          return date === today
        case 'month':
          return date >= monthStart && date <= monthEnd
        case 'pending':
          return date < today && !row.paid && row.status !== 'canceled'
        default:
          return true
      }
    })
  }, [tableData, quickFilter])

  const studentOptions = activeStudents.map((s) => ({ ...s, label: s.name, value: s.id }))
  const feeOptions = fees.map((f) => ({ ...f, label: f.duration, value: f.duration }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Lessons</h2>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setFormData(resetFormData())
            setModalOpen(true)
          }}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Lesson
        </Button>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <Modal
        isOpen={!!studentPopupStudent}
        onClose={() => setStudentPopupStudent(null)}
        title={studentPopupStudent ? `${studentPopupStudent.name} – Details` : 'Student Details'}
      >
        {studentPopupStudent && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                District/Area
              </Typography>
              <Typography variant="body2">{studentPopupStudent.location || '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Address
              </Typography>
              <Typography variant="body2">{studentPopupStudent.address || '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Goal / Focus
              </Typography>
              <Typography variant="body2">{studentPopupStudent.goal || '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Payment method
              </Typography>
              <Typography variant="body2">{studentPopupStudent.paymentMethod || '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Default fee
              </Typography>
              <Typography variant="body2">{studentPopupStudent.defaultDuration || '—'}</Typography>
            </Box>
            {studentPopupStudent.notes && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Notes
                </Typography>
                <Typography variant="body2">{studentPopupStudent.notes}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Status
              </Typography>
              <StatusBadge variant={studentPopupStudent.active !== false ? 'success' : 'neutral'}>
                {studentPopupStudent.active !== false ? 'Active' : 'Inactive'}
              </StatusBadge>
            </Box>
          </Stack>
        )}
      </Modal>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setConfirmStep('form')
          setPendingLessons([])
          setEditingLessonIndex(null)
          setEditingLesson(null)
        }}
        title={editingLesson ? 'Edit Lesson' : confirmStep === 'form' ? 'Add Lesson' : 'Confirm Lessons'}
      >
        {editingLesson ? (
        <form onSubmit={handleSaveEdit}>
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {getStudentName(editingLesson.studentId) || '—'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'nowrap' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <DatePicker
                  label="Date"
                  value={editingLesson.date ? dayjs(editingLesson.date) : null}
                  onChange={(d) => updateEditingLesson({ date: d ? d.format('YYYY-MM-DD') : '' })}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <TimePickerInput
                  value={editingLesson.time}
                  onChange={(v) => updateEditingLesson({ time: v })}
                  placeholder="Time"
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Box>
            </Box>
            <SearchableSelect
              options={feeOptions}
              value={editingLesson.duration}
              onChange={(v) => {
                const feeEntry = fees.find((f) => f.duration === v)
                updateEditingLesson({
                  duration: v,
                  fee: feeEntry ? feeEntry.fee : editingLesson.fee,
                })
              }}
              placeholder="Select duration..."
              getOptionLabel={(opt) => opt.duration ?? opt.label}
              getOptionValue={(opt) => opt.duration ?? opt.value}
              size="small"
            />
            <TextField
              label="Fee (HKD)"
              type="number"
              value={editingLesson.fee}
              onChange={(e) => updateEditingLesson({ fee: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0, step: 1 }}
              size="small"
              fullWidth
            />
            <TextField
              label="Notes"
              value={editingLesson.notes ?? ''}
              onChange={(e) => updateEditingLesson({ notes: e.target.value })}
              placeholder="Optional notes"
              size="small"
              fullWidth
              multiline
              minRows={2}
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained">
                Save
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => { setModalOpen(false); setEditingLesson(null) }}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </form>
        ) : confirmStep === 'form' ? (
        <form onSubmit={handleProceedToConfirm}>
          <Stack spacing={2}>
            <SearchableSelect
              options={studentOptions}
              value={formData.studentId}
              onChange={(v) => {
                const student = activeStudents.find((s) => s.id === v)
                const defaultDuration = student?.defaultDuration
                const feeEntry = defaultDuration ? fees.find((f) => f.duration === defaultDuration) : null
                setFormData({
                  ...formData,
                  studentId: v,
                  duration: defaultDuration || formData.duration,
                  fee: feeEntry ? String(feeEntry.fee) : formData.fee,
                })
              }}
              placeholder="Select student..."
              getOptionLabel={(opt) => opt.name ?? opt.label}
              getOptionValue={(opt) => opt.id ?? opt.value}
            />
            <SearchableSelect
              options={feeOptions}
              value={formData.duration}
              onChange={(v) => handleDurationChange(v)}
              placeholder="Select duration..."
              getOptionLabel={(opt) => opt.duration ?? opt.label}
              getOptionValue={(opt) => opt.duration ?? opt.value}
            />
            <TextField
              label="Fee (HKD)"
              type="number"
              value={formData.fee}
              onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
              placeholder="Auto-filled from Fees"
              inputProps={{ min: 0, step: 1 }}
              required
              fullWidth
            />

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <ToggleButtonGroup
                value={formData.mode}
                exclusive
                onChange={(_, v) => v && setFormData({ ...formData, mode: v })}
                fullWidth
              >
                <ToggleButton value="single">Single lesson</ToggleButton>
                <ToggleButton value="recurring">Recurring (monthly)</ToggleButton>
              </ToggleButtonGroup>
            </div>

            {formData.mode === 'single' ? (
              <>
                <DatePicker
                  label="Date"
                  value={formData.date ? dayjs(formData.date) : null}
                  onChange={(d) => setFormData({ ...formData, date: d ? d.format('YYYY-MM-DD') : '' })}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
                <TimePickerInput
                  value={formData.time}
                  onChange={(v) => setFormData({ ...formData, time: v })}
                  placeholder="Time (optional)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.paid}
                      onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                    />
                  }
                  label="Paid?"
                />
              </>
            ) : (
              <>
                <FormControl fullWidth>
                  <InputLabel>Weekday</InputLabel>
                  <Select
                    value={formData.weekday}
                    label="Weekday"
                    onChange={(e) => setFormData({ ...formData, weekday: parseInt(e.target.value, 10) })}
                  >
                    {WEEKDAYS.map((w) => (
                      <MenuItem key={w.value} value={w.value}>
                        {w.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <DatePicker
                  label="Month"
                  value={formData.monthYear ? dayjs(formData.monthYear + '-01') : null}
                  onChange={(d) => setFormData({ ...formData, monthYear: d ? d.format('YYYY-MM') : '' })}
                  views={['month', 'year']}
                  slotProps={{ textField: { fullWidth: true, required: formData.mode === 'recurring' } }}
                />
                <TimePickerInput
                  value={formData.time}
                  onChange={(v) => setFormData({ ...formData, time: v })}
                  placeholder="Time (optional)"
                />
              </>
            )}

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes"
              fullWidth
              multiline
              minRows={2}
            />
            {formData.mode === 'recurring' && recurringDates.length > 0 && (
              <Box sx={{ py: 1.5, px: 2, borderRadius: 1, bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Preview
                </Typography>
                <Typography variant="body2">
                  {recurringDates.length} lesson{recurringDates.length !== 1 ? 's' : ''}: {recurringDates.map((d) => formatDate(d)).join(', ')}
                </Typography>
              </Box>
            )}
            <Stack direction="row" spacing={1} pt={1}>
              <Button type="submit" variant="contained">
                {formData.mode === 'single' ? 'Review' : `Review ${recurringDates.length} Lessons`}
              </Button>
              <Button type="button" variant="outlined" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </form>
        ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Review and edit each lesson below. Lessons on public holidays are marked with a warning.
          </p>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {pendingLessons.map((lesson, index) => {
              const holidayInfo = isHoliday(lesson.date)

              // Find existing scheduled lessons on the same day, sorted by time
              const sameDayExisting = lessons
                .filter(
                  (l) =>
                    l.date === lesson.date &&
                    l.status !== 'canceled' &&
                    l.time
                )
                .sort((a, b) => a.time.localeCompare(b.time))

              // Identify the nearest existing lesson before and after this pending one
              const pendingStart = timeToMinutes(lesson.time)
              const pendingEnd =
                pendingStart != null
                  ? pendingStart + parseDurationMinutes(lesson.duration)
                  : null

              const lessonBefore = lesson.time
                ? sameDayExisting.findLast(
                    (l) => timeToMinutes(l.time) + parseDurationMinutes(l.duration) <= (pendingStart ?? Infinity)
                  )
                : null
              const lessonAfter = lesson.time
                ? sameDayExisting.find(
                    (l) => timeToMinutes(l.time) >= (pendingEnd ?? -1)
                  )
                : null

              const studentForPending = getStudent(lesson.studentId)

              return (
                <div
                  key={`${lesson.date}-${index}`}
                  className={`rounded-lg border p-3 ${
                    holidayInfo ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200 bg-gray-50/50'
                  }`}
                >
                  <div className="mb-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-gray-700">Lesson {index + 1}</span>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {editingLessonIndex === index ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setEditingLessonIndex(null)}
                            sx={{ minWidth: 'auto', px: 1, py: 0.25, fontSize: '0.75rem' }}
                          >
                            Done
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                            onClick={() => setEditingLessonIndex(index)}
                            sx={{ minWidth: 'auto', px: 1, py: 0.25, fontSize: '0.75rem' }}
                          >
                            Edit
                          </Button>
                        )}
                        {pendingLessons.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => setConfirmRemoveIndex(index)}
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: 'error.main',
                              color: 'error.contrastText',
                              '&:hover': { bgcolor: 'error.dark' },
                              '& .MuiSvgIcon-root': { fontSize: 16 },
                            }}
                            aria-label="Remove lesson"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Stack>
                    </div>
                    {holidayInfo && (
                      <Box sx={{ mt: 1 }}>
                        <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
                          Public holiday: {holidayInfo.name}
                        </span>
                      </Box>
                    )}
                  </div>
                  <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                    {getStudentName(lesson.studentId) || '—'}
                  </Typography>

                  {/* Transit warnings: show transit info to/from adjacent existing lessons */}
                  {lessonBefore && studentForPending && (
                    <Box sx={{ mx: -1.5, mb: 1, borderRadius: 1, overflow: 'hidden' }}>
                      <TransitInfo
                        fromStudent={getStudent(lessonBefore.studentId)}
                        toStudent={studentForPending}
                        gapMinutes={getGapMinutes(lessonBefore, lesson)}
                      />
                    </Box>
                  )}
                  {lessonAfter && studentForPending && (
                    <Box sx={{ mx: -1.5, mb: 1, borderRadius: 1, overflow: 'hidden' }}>
                      <TransitInfo
                        fromStudent={studentForPending}
                        toStudent={getStudent(lessonAfter.studentId)}
                        gapMinutes={getGapMinutes(lesson, lessonAfter)}
                      />
                    </Box>
                  )}
                  {editingLessonIndex === index ? (
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'nowrap' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <DatePicker
                            label="Date"
                            value={lesson.date ? dayjs(lesson.date) : null}
                            onChange={(d) => updatePendingLesson(index, { date: d ? d.format('YYYY-MM-DD') : '' })}
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <TimePickerInput
                            key={`time-${index}`}
                            variant="mobile"
                            value={lesson.time}
                            onChange={(v) => updatePendingLesson(index, { time: v })}
                            placeholder="Time"
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                          />
                        </Box>
                      </Box>
                      <SearchableSelect
                        options={feeOptions}
                        value={lesson.duration}
                        onChange={(v) => {
                          const feeEntry = fees.find((f) => f.duration === v)
                          updatePendingLesson(index, {
                            duration: v,
                            fee: feeEntry ? feeEntry.fee : lesson.fee,
                          })
                        }}
                        placeholder="Select duration..."
                        getOptionLabel={(opt) => opt.duration ?? opt.label}
                        getOptionValue={(opt) => opt.duration ?? opt.value}
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label="Fee (HKD)"
                        type="number"
                        value={lesson.fee}
                        onChange={(e) => updatePendingLesson(index, { fee: parseFloat(e.target.value) || 0 })}
                        inputProps={{ min: 0, step: 1 }}
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label="Notes"
                        value={lesson.notes}
                        onChange={(e) => updatePendingLesson(index, { notes: e.target.value })}
                        placeholder="Optional notes"
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                      />
                    </Stack>
                  ) : (
                    <Box sx={{ py: 0.5 }}>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          <strong>Date:</strong> {formatDate(lesson.date)} · <strong>Time:</strong> {formatTime(lesson.time)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Duration:</strong> {lesson.duration || '—'} · <strong>Fee:</strong> {lesson.fee ? `${lesson.fee} HKD` : '—'}
                        </Typography>
                        {lesson.notes && (
                          <Typography variant="body2">
                            <strong>Notes:</strong> {lesson.notes}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  )}
                </div>
              )
            })}
          </div>
          <Stack direction="row" spacing={1} pt={2} sx={{ borderTop: '1px solid #e5e7eb' }}>
            <Button variant="outlined" onClick={handleBackToForm}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmSubmit}
              disabled={pendingLessons.length === 0}
            >
              Add {pendingLessons.length} Lesson{pendingLessons.length !== 1 ? 's' : ''}
            </Button>
          </Stack>
        </div>
        )}
      </Modal>

      <Dialog
        open={confirmRemoveIndex !== null}
        onClose={() => setConfirmRemoveIndex(null)}
        aria-labelledby="confirm-remove-lesson-title"
        aria-describedby="confirm-remove-lesson-description"
      >
        <DialogTitle id="confirm-remove-lesson-title">Remove lesson?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-remove-lesson-description">
            This lesson will be removed from the list. You can add it again from the form if needed.
          </DialogContentText>
          {confirmRemoveIndex !== null && pendingLessons[confirmRemoveIndex] && (() => {
            const lesson = pendingLessons[confirmRemoveIndex]
            return (
              <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'grey.100' }}>
                <Typography variant="body2" component="div">
                  <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Date: </Box>{formatDate(lesson.date)}<br />
                  <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Time: </Box>{formatTime(lesson.time)}<br />
                  <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Student: </Box>{getStudentName(lesson.studentId) || '—'}<br />
                  {lesson.duration && <><Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Duration: </Box>{lesson.duration}<br /></>}
                  {lesson.fee != null && <><Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Fee: </Box>{lesson.fee} HKD</>}
                </Typography>
              </Box>
            )
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoveIndex(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (confirmRemoveIndex !== null) {
                removePendingLesson(confirmRemoveIndex)
                setConfirmRemoveIndex(null)
              }
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDeleteLesson !== null}
        onClose={() => setConfirmDeleteLesson(null)}
        aria-labelledby="confirm-delete-lesson-title"
        aria-describedby="confirm-delete-lesson-description"
      >
        <DialogTitle id="confirm-delete-lesson-title">Delete lesson?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-lesson-description">
            You are about to permanently delete this lesson.
          </DialogContentText>
          {confirmDeleteLesson && (
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'grey.100' }}>
              <Typography variant="body2" component="div">
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Date: </Box>{formatDate(confirmDeleteLesson.date)}<br />
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Time: </Box>{formatTime(confirmDeleteLesson.time)}<br />
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Student: </Box>{confirmDeleteLesson._studentName ?? '—'}<br />
                {confirmDeleteLesson.duration && <><Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Duration: </Box>{confirmDeleteLesson.duration}<br /></>}
                {confirmDeleteLesson.fee != null && <><Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Fee: </Box>{confirmDeleteLesson.fee} HKD</>}
              </Typography>
            </Box>
          )}
          <DialogContentText sx={{ mt: 1.5 }}>This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteLesson(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => confirmDeleteLesson !== null && handleDelete(confirmDeleteLesson.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : (
        <SortableTable
          columns={COLUMNS}
          data={filteredTableData}
          emptyMessage="No lessons yet. Click Add Lesson to create one."
          searchPlaceholder="Search by student, date, notes..."
          cardTitleKey="studentName"
          cardSubtitleKeys={['date', 'time']}
          getRowClassName={(row) =>
            isCanceled(row)
              ? '!bg-gray-200 opacity-75'
              : isTodayLesson(row)
                ? '!bg-sky-50'
                : isPastLesson(row)
                  ? 'opacity-90'
                  : ''
          }
          renderBetweenRows={(prevRow, currRow) => {
            if (prevRow.date !== currRow.date) return null
            if (prevRow.status === 'canceled' || currRow.status === 'canceled') return null
            if (!prevRow._student || !currRow._student) return null
            const gapMinutes = getGapMinutes(prevRow, currRow)
            return (
              <TransitInfo
                fromStudent={prevRow._student}
                toStudent={currRow._student}
                gapMinutes={gapMinutes}
              />
            )
          }}
          headerSlot={
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Chip
                label="All"
                onClick={() => {
                  setQuickFilter(null)
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev)
                    next.delete('filter')
                    return next
                  }, { replace: true })
                }}
                color={quickFilter === null ? 'primary' : 'default'}
                variant={quickFilter === null ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="Today"
                onClick={() => {
                  setQuickFilter('today')
                  setSearchParams({ filter: 'today' }, { replace: true })
                }}
                color={quickFilter === 'today' ? 'primary' : 'default'}
                variant={quickFilter === 'today' ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="This month"
                onClick={() => {
                  setQuickFilter('month')
                  setSearchParams({ filter: 'month' }, { replace: true })
                }}
                color={quickFilter === 'month' ? 'primary' : 'default'}
                variant={quickFilter === 'month' ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="Pending payment"
                onClick={() => {
                  setQuickFilter('pending')
                  setSearchParams({ filter: 'pending' }, { replace: true })
                }}
                color={quickFilter === 'pending' ? 'primary' : 'default'}
                variant={quickFilter === 'pending' ? 'filled' : 'outlined'}
                size="small"
              />
            </Box>
          }
          renderActions={(row) => (
            <>
              <Button size="small" variant="outlined" onClick={() => handleEditLesson(row)}>
                Edit
              </Button>
              {isCanceled(row) ? (
                <Button size="small" variant="outlined" onClick={() => handleRestore(row)}>
                  Restore
                </Button>
              ) : (
                <Button size="small" variant="outlined" onClick={() => handleCancel(row)}>
                  Cancel
                </Button>
              )}
              <IconButton
                size="small"
                color="error"
                onClick={() => setConfirmDeleteLesson(row)}
                aria-label="Delete"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        />
      )}
    </div>
  )
}
