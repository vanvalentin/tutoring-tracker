import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TextField, Button, Checkbox, FormControlLabel, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { useMaterial } from '../hooks/useSupabase'
import Modal from '../components/Modal'
import SortableTable from '../components/SortableTable'
import StatusBadge from '../components/StatusBadge'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const COLUMNS = [
  { key: 'date', label: 'Date Purchased', cell: (val) => formatDate(val) },
  { key: 'description', label: 'Material/Item Description' },
  { key: 'amount', label: 'Amount (HKD)' },
  { key: 'vendor', label: 'Vendor/Source' },
  {
    key: 'paidByParent',
    label: 'Paid by Parent',
    cell: (val) => (
      <StatusBadge variant={val ? 'success' : 'neutral'}>
        {val ? 'Yes' : 'No'}
      </StatusBadge>
    ),
  },
  { key: 'note', label: 'Note/Purpose' },
]

export default function MaterialPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: material, loading, error, add, update, remove } = useMaterial()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    vendor: '',
    paidByParent: false,
    note: '',
  })

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams({}, { replace: true })
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        description: '',
        amount: '',
        vendor: '',
        paidByParent: false,
        note: '',
      })
      setModalOpen(true)
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amountNum = parseFloat(formData.amount)
    if (!formData.description.trim() || isNaN(amountNum)) return
    try {
      if (editingId) {
        await update(editingId, {
          date: formData.date,
          description: formData.description,
          amount: amountNum,
          vendor: formData.vendor,
          paidByParent: formData.paidByParent,
          note: formData.note,
        })
      } else {
        await add({
          date: formData.date,
          description: formData.description,
          amount: amountNum,
          vendor: formData.vendor,
          paidByParent: formData.paidByParent,
          note: formData.note,
        })
      }
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        description: '',
        amount: '',
        vendor: '',
        paidByParent: false,
        note: '',
      })
      setEditingId(null)
      setModalOpen(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setFormData({
      date: item.date,
      description: item.description ?? '',
      amount: String(item.amount ?? ''),
      vendor: item.vendor ?? '',
      paidByParent: item.paidByParent ?? false,
      note: item.note ?? '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await remove(id)
      if (editingId === id) {
        setEditingId(null)
        setModalOpen(false)
      }
      setConfirmDeleteItem(null)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Material</h2>
        <Button
          variant="contained"
          onClick={() => {
            setEditingId(null)
            setFormData({
              date: new Date().toISOString().slice(0, 10),
              description: '',
              amount: '',
              vendor: '',
              paidByParent: false,
              note: '',
            })
            setModalOpen(true)
          }}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Entry
        </Button>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null) }}
        title={editingId ? 'Edit Material Entry' : 'Add Material Entry'}
      >
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <DatePicker
              label="Date Purchased"
              value={formData.date ? dayjs(formData.date) : null}
              onChange={(d) => setFormData({ ...formData, date: d ? d.format('YYYY-MM-DD') : '' })}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
            <TextField
              label="Material/Item Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Advanced Calculus Textbook"
              required
              fullWidth
            />
            <TextField
              label="Amount (HKD)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              inputProps={{ min: 0, step: 1 }}
              required
              fullWidth
            />
            <TextField
              label="Vendor/Source"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder="e.g. Commercial Press"
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.paidByParent}
                  onChange={(e) => setFormData({ ...formData, paidByParent: e.target.checked })}
                />
              }
              label="Paid by Parent?"
            />
            <TextField
              label="Note/Purpose"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Optional note"
              fullWidth
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained">
                {editingId ? 'Save' : 'Add Entry'}
              </Button>
              <Button type="button" variant="outlined" onClick={() => { setModalOpen(false); setEditingId(null) }}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </form>
      </Modal>

      <Dialog
        open={confirmDeleteItem !== null}
        onClose={() => setConfirmDeleteItem(null)}
        aria-labelledby="confirm-delete-material-title"
        aria-describedby="confirm-delete-material-description"
      >
        <DialogTitle id="confirm-delete-material-title">Delete material entry?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-material-description">
            You are about to delete this material entry.
          </DialogContentText>
          {confirmDeleteItem && (
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'grey.100' }}>
              <Typography variant="body2" component="div">
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Date: </Box>{formatDate(confirmDeleteItem.date)}<br />
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Description: </Box>{confirmDeleteItem.description || '—'}<br />
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Amount: </Box>{confirmDeleteItem.amount} HKD
                {confirmDeleteItem.vendor?.trim() && <><br /><Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Vendor: </Box>{confirmDeleteItem.vendor}</>}
                {confirmDeleteItem.note?.trim() && <><br /><Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Note: </Box>{confirmDeleteItem.note}</>}
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
          data={material}
          emptyMessage="No material entries yet. Click Add Entry to create one."
          searchPlaceholder="Search by description, vendor..."
          cardTitleKey="description"
          renderActions={(row) => (
            <>
              <Button size="small" variant="outlined" onClick={() => handleEdit(row)}>
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
