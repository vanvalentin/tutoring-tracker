import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TextField, Button, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { useTransportation } from '../hooks/useSupabase'
import { TRANSPORT_TYPES } from '../data/schema'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SortableTable from '../components/SortableTable'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const COLUMNS = [
  { key: 'date', label: 'Date', cell: (val) => formatDate(val) },
  { key: 'amount', label: 'Amount (HKD)' },
  { key: 'type', label: 'Type' },
  { key: 'destination', label: 'Destination/Route' },
  { key: 'note', label: 'Note' },
]

export default function TransportationPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: transportation, loading, error, add, update, remove } = useTransportation()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    type: '',
    destination: '',
    note: '',
  })

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams({}, { replace: true })
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        amount: '',
        type: '',
        destination: '',
        note: '',
      })
      setModalOpen(true)
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amountNum = parseFloat(formData.amount)
    if (isNaN(amountNum)) return
    try {
      if (editingId) {
        await update(editingId, {
          date: formData.date,
          amount: amountNum,
          type: formData.type,
          destination: formData.destination,
          note: formData.note,
        })
      } else {
        await add({
          date: formData.date,
          amount: amountNum,
          type: formData.type,
          destination: formData.destination,
          note: formData.note,
        })
      }
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        amount: '',
        type: '',
        destination: '',
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
      amount: String(item.amount ?? ''),
      type: item.type ?? '',
      destination: item.destination ?? '',
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
        <h2 className="text-xl font-semibold text-gray-900">Transportation</h2>
        <Button
          variant="contained"
          onClick={() => {
            setEditingId(null)
            setFormData({
              date: new Date().toISOString().slice(0, 10),
              amount: '',
              type: '',
              destination: '',
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
        title={editingId ? 'Edit Transportation Entry' : 'Add Transportation Entry'}
      >
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <DatePicker
              label="Date"
              value={formData.date ? dayjs(formData.date) : null}
              onChange={(d) => setFormData({ ...formData, date: d ? d.format('YYYY-MM-DD') : '' })}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
            <TextField
              label="Amount (HKD)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              inputProps={{ min: 0, step: 0.01 }}
              required
              fullWidth
            />
            <SearchableSelect
              options={TRANSPORT_TYPES}
              value={formData.type}
              onChange={(v) => setFormData({ ...formData, type: v })}
              placeholder="Type"
            />
            <TextField
              label="Destination/Route"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g. Central to Admiralty"
              fullWidth
            />
            <TextField
              label="Note"
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
        aria-labelledby="confirm-delete-transport-title"
        aria-describedby="confirm-delete-transport-description"
      >
        <DialogTitle id="confirm-delete-transport-title">Delete transportation entry?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-transport-description">
            You are about to delete this transportation entry.
          </DialogContentText>
          {confirmDeleteItem && (
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'grey.100' }}>
              <Typography variant="body2" component="div">
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Date: </Box>{formatDate(confirmDeleteItem.date)}<br />
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Amount: </Box>{confirmDeleteItem.amount} HKD<br />
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Type: </Box>{confirmDeleteItem.type || '—'}
                {confirmDeleteItem.destination?.trim() && <><br /><Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Destination: </Box>{confirmDeleteItem.destination}</>}
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
          data={transportation}
          emptyMessage="No transportation entries yet. Click Add Entry to create one."
          searchPlaceholder="Search by type, destination, note..."
          cardTitleKey="type"
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
