import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TextField, Button, Checkbox, FormControlLabel, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, Typography } from '@mui/material'
import { useStudents, useFees } from '../hooks/useSupabase'
import { LOCATIONS, GOALS, PAYMENT_METHODS } from '../data/schema'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SortableTable from '../components/SortableTable'
import StatusBadge from '../components/StatusBadge'

const COLUMNS = [
  { key: 'name', label: 'Student Name' },
  { key: 'location', label: 'District/Area' },
  { key: 'defaultDuration', label: 'Default Fee', cell: (val) => val || '—' },
  { key: 'address', label: 'Full Address' },
  { key: 'goal', label: 'Goal/Focus' },
  { key: 'paymentMethod', label: 'Payment method' },
  { key: 'notes', label: 'Notes' },
  {
    key: 'active',
    label: 'Status',
    cell: (val) => (
      <StatusBadge variant={val !== false ? 'success' : 'neutral'}>
        {val !== false ? 'Active' : 'Inactive'}
      </StatusBadge>
    ),
  },
]

export default function StudentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: students, loading, error, add, update, remove } = useStudents()
  const { data: fees } = useFees()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    goal: '',
    paymentMethod: '',
    defaultDuration: '',
    notes: '',
    active: true,
  })

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams({}, { replace: true })
      setFormData({
        name: '',
        location: '',
        address: '',
        goal: '',
        paymentMethod: '',
        defaultDuration: '',
        notes: '',
        active: true,
      })
      setEditingId(null)
      setModalOpen(true)
    }
  }, [searchParams])

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      address: '',
      goal: '',
      paymentMethod: '',
      defaultDuration: '',
      notes: '',
      active: true,
    })
    setEditingId(null)
    setModalOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    try {
      if (editingId) {
        await update(editingId, formData)
      } else {
        await add(formData)
      }
      resetForm()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEdit = (student) => {
    setEditingId(student.id)
    setFormData({
      name: student.name,
      location: student.location ?? '',
      address: student.address ?? '',
      goal: student.goal ?? '',
      paymentMethod: student.paymentMethod ?? '',
      defaultDuration: student.defaultDuration ?? '',
      notes: student.notes ?? '',
      active: student.active ?? true,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await remove(id)
      if (editingId === id) resetForm()
      setConfirmDeleteItem(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const locationOptions = LOCATIONS
  const goalOptions = GOALS
  const paymentOptions = PAYMENT_METHODS
  const defaultFeeOptions = fees.map((f) => ({
    ...f,
    label: `${f.duration} (${f.fee} HKD)`,
    value: f.duration,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Students</h2>
        <Button
          variant="contained"
          onClick={() => {
            resetForm()
            setFormData({ name: '', location: '', address: '', goal: '', paymentMethod: '', defaultDuration: '', notes: '', active: true })
            setModalOpen(true)
          }}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Student
        </Button>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <Modal isOpen={modalOpen} onClose={resetForm} title={editingId ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Student Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full name"
              required
              fullWidth
            />
            <SearchableSelect
              options={locationOptions}
              value={formData.location}
              onChange={(v) => setFormData({ ...formData, location: v })}
              placeholder="District/Area"
            />
            <TextField
              label="Full Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
              fullWidth
            />
            {/* Goal/Focus hidden for now
            <SearchableSelect
              options={goalOptions}
              value={formData.goal}
              onChange={(v) => setFormData({ ...formData, goal: v })}
              placeholder="Goal/Focus"
            />
            */}
            <SearchableSelect
              options={paymentOptions}
              value={formData.paymentMethod}
              onChange={(v) => setFormData({ ...formData, paymentMethod: v })}
              placeholder="Payment method"
            />
            <SearchableSelect
              options={defaultFeeOptions}
              value={formData.defaultDuration}
              onChange={(v) => setFormData({ ...formData, defaultDuration: v })}
              placeholder="Default fee (for new lessons)"
              getOptionLabel={(opt) => opt.label ?? `${opt.duration} (${opt.fee} HKD)`}
              getOptionValue={(opt) => opt.duration ?? opt.value}
            />
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes"
              fullWidth
              multiline
              minRows={2}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              }
              label="Active"
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained">
                {editingId ? 'Update' : 'Add'} Student
              </Button>
              <Button type="button" variant="outlined" onClick={resetForm}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </form>
      </Modal>

      <Dialog
        open={confirmDeleteItem !== null}
        onClose={() => setConfirmDeleteItem(null)}
        aria-labelledby="confirm-delete-student-title"
        aria-describedby="confirm-delete-student-description"
      >
        <DialogTitle id="confirm-delete-student-title">Delete student?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-student-description">
            You are about to delete this student and their related data.
          </DialogContentText>
          {confirmDeleteItem && (
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'grey.100' }}>
              <Typography variant="body2" component="div">
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Name: </Box>{confirmDeleteItem.name || '—'}<br />
                {confirmDeleteItem.location?.trim() && <><Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Location: </Box>{confirmDeleteItem.location}<br /></>}
                {confirmDeleteItem.address?.trim() && <><Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Address: </Box>{confirmDeleteItem.address}</>}
              </Typography>
            </Box>
          )}
          <DialogContentText sx={{ mt: 1.5 }}>This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteItem(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => confirmDeleteItem !== null && handleDelete(confirmDeleteItem.id)}
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
          data={students}
          emptyMessage="No students yet. Click Add Student to create one."
          searchPlaceholder="Search by name, location, goal..."
          cardTitleKey="name"
          renderActions={(row) => (
            <>
              <Button size="small" onClick={() => handleEdit(row)}>
                Edit
              </Button>
              <Button size="small" color="error" onClick={() => setConfirmDeleteItem(row)}>
                Delete
              </Button>
            </>
          )}
        />
      )}
    </div>
  )
}
