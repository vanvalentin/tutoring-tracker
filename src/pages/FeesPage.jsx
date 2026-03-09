import { useState } from 'react'
import { TextField, Button, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, Typography } from '@mui/material'
import { useFees } from '../hooks/useSupabase'
import Modal from '../components/Modal'
import SortableTable from '../components/SortableTable'

const COLUMNS = [
  { key: 'label', label: 'Fee Label' },
  { key: 'durationMinutes', label: 'Duration', cell: (val) => `${val} min` },
  { key: 'fee', label: 'Fee (HKD)' },
  { key: 'description', label: 'Description' },
]

export default function FeesPage() {
  const { data: fees, loading, error, add, update, remove } = useFees()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null)
  const [formData, setFormData] = useState({
    label: '',
    durationMinutes: '',
    fee: '',
    description: '',
  })

  const resetForm = () => {
    setFormData({ label: '', durationMinutes: '', fee: '', description: '' })
    setEditingId(null)
    setModalOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const durationMinutes = parseInt(formData.durationMinutes, 10)
    const feeNum = parseFloat(formData.fee)
    if (!formData.label.trim() || !Number.isInteger(durationMinutes) || durationMinutes <= 0 || isNaN(feeNum)) return
    try {
      if (editingId) {
        await update(editingId, {
          label: formData.label.trim(),
          durationMinutes,
          fee: feeNum,
          description: formData.description.trim(),
        })
      } else {
        await add({
          label: formData.label.trim(),
          durationMinutes,
          fee: feeNum,
          description: formData.description.trim(),
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
      label: fee.label,
      durationMinutes: String(fee.durationMinutes),
      fee: String(fee.fee),
      description: fee.description ?? '',
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Fees</h2>
        <Button
          variant="contained"
          onClick={() => {
            resetForm()
            setFormData({ label: '', durationMinutes: '', fee: '', description: '' })
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
              label="Fee Label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g. Standard 90-minute lesson"
              required
              fullWidth
            />
            <TextField
              label="Duration (minutes)"
              type="number"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
              placeholder="90"
              inputProps={{ min: 1, step: 1 }}
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

      <Dialog
        open={confirmDeleteItem !== null}
        onClose={() => setConfirmDeleteItem(null)}
        aria-labelledby="confirm-delete-fee-title"
        aria-describedby="confirm-delete-fee-description"
      >
        <DialogTitle id="confirm-delete-fee-title">Delete fee entry?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-fee-description">
            You are about to delete this fee entry.
          </DialogContentText>
          {confirmDeleteItem && (
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'grey.100' }}>
              <Typography variant="body2" component="div">
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Fee label: </Box>{confirmDeleteItem.label}<br />
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Duration: </Box>{confirmDeleteItem.durationMinutes} min<br />
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Fee: </Box>{confirmDeleteItem.fee} HKD
                {confirmDeleteItem.description?.trim() && (
                  <><br /><Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Description: </Box>{confirmDeleteItem.description}</>
                )}
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
          data={fees}
          emptyMessage="No fee entries yet. Click Add Fee to create one."
          searchPlaceholder="Search by fee label or description..."
          cardTitleKey="label"
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
