import { useState } from 'react'
import { TextField, Button, Stack } from '@mui/material'
import { useFees } from '../hooks/useSupabase'
import Modal from '../components/Modal'
import SortableTable from '../components/SortableTable'

const COLUMNS = [
  { key: 'duration', label: 'Lesson Duration' },
  { key: 'fee', label: 'Fee (HKD)' },
  { key: 'description', label: 'Description' },
]

export default function FeesPage() {
  const { data: fees, loading, error, add, update, remove } = useFees()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    duration: '',
    fee: '',
    description: '',
  })

  const resetForm = () => {
    setFormData({ duration: '', fee: '', description: '' })
    setEditingId(null)
    setModalOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const feeNum = parseFloat(formData.fee)
    if (!formData.duration.trim() || isNaN(feeNum)) return
    try {
      if (editingId) {
        await update(editingId, {
          duration: formData.duration,
          fee: feeNum,
          description: formData.description,
        })
      } else {
        await add({
          duration: formData.duration,
          fee: feeNum,
          description: formData.description,
        })
      }
      resetForm()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEdit = (fee) => {
    setEditingId(fee.id)
    setFormData({
      duration: fee.duration,
      fee: String(fee.fee),
      description: fee.description ?? '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this fee entry?')) return
    try {
      await remove(id)
      if (editingId === id) resetForm()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Fees</h2>
        <Button
          variant="contained"
          onClick={() => {
            resetForm()
            setFormData({ duration: '', fee: '', description: '' })
            setModalOpen(true)
          }}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Fee
        </Button>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <Modal isOpen={modalOpen} onClose={resetForm} title={editingId ? 'Edit Fee' : 'Add Fee'}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Lesson Duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g. 1.0 hour"
              required
              fullWidth
            />
            <TextField
              label="Fee (HKD)"
              type="number"
              value={formData.fee}
              onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
              placeholder="360"
              inputProps={{ min: 0, step: 1 }}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Standard Private Lesson"
              fullWidth
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained">
                {editingId ? 'Update' : 'Add'} Fee
              </Button>
              <Button type="button" variant="outlined" onClick={resetForm}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </form>
      </Modal>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : (
        <SortableTable
          columns={COLUMNS}
          data={fees}
          emptyMessage="No fee entries yet. Click Add Fee to create one."
          searchPlaceholder="Search by duration, description..."
          cardTitleKey="duration"
          renderActions={(row) => (
            <>
              <Button size="small" onClick={() => handleEdit(row)}>
                Edit
              </Button>
              <Button size="small" color="error" onClick={() => handleDelete(row.id)}>
                Delete
              </Button>
            </>
          )}
        />
      )}
    </div>
  )
}
