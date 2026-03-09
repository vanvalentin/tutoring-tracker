import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TextField, Button, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { usePersonalExpenses } from '../hooks/useSupabase'
import Modal from '../components/Modal'
import SortableTable from '../components/SortableTable'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const COLUMNS = [
  { key: 'date', label: 'Date', cell: (val) => formatDate(val) },
  { key: 'description', label: 'Expense Description' },
  { key: 'amount', label: 'Amount (HKD)' },
  { key: 'category', label: 'Category' },
  { key: 'vendor', label: 'Vendor/Source' },
  { key: 'note', label: 'Note' },
]

export default function PersonalExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: personalExpenses, loading, error, add, update, remove } = usePersonalExpenses()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    category: '',
    vendor: '',
    note: '',
  })

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams({}, { replace: true })
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        description: '',
        amount: '',
        category: '',
        vendor: '',
        note: '',
      })
      setModalOpen(true)
    }
  }, [searchParams, setSearchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amountNum = parseFloat(formData.amount)
    if (isNaN(amountNum)) return
    const normalizedDate = formData.date || new Date().toISOString().slice(0, 10)
    const normalizedDescription = formData.description.trim()

    try {
      if (editingId) {
        await update(editingId, {
          date: normalizedDate,
          description: normalizedDescription,
          amount: amountNum,
          category: formData.category,
          vendor: formData.vendor,
          note: formData.note,
        })
      } else {
        await add({
          date: normalizedDate,
          description: normalizedDescription,
          amount: amountNum,
          category: formData.category,
          vendor: formData.vendor,
          note: formData.note,
        })
      }

      setFormData({
        date: new Date().toISOString().slice(0, 10),
        description: '',
        amount: '',
        category: '',
        vendor: '',
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
      category: item.category ?? '',
      vendor: item.vendor ?? '',
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
        <h2 className="text-xl font-semibold text-gray-900">Personal Expenses</h2>
        <Button
          variant="contained"
          onClick={() => {
            setEditingId(null)
            setFormData({
              date: new Date().toISOString().slice(0, 10),
              description: '',
              amount: '',
              category: '',
              vendor: '',
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
        title={editingId ? 'Edit Personal Expense' : 'Add Personal Expense'}
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
              label="Expense Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Laptop bag"
              fullWidth
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
            <TextField
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Food, Shopping, Bills"
              fullWidth
            />
            <TextField
              label="Vendor/Source"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder="Optional vendor"
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
        aria-labelledby="confirm-delete-personal-expense-title"
        aria-describedby="confirm-delete-personal-expense-description"
      >
        <DialogTitle id="confirm-delete-personal-expense-title">Delete personal expense?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-personal-expense-description">
            You are about to delete this personal expense.
          </DialogContentText>
          {confirmDeleteItem && (
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'grey.100' }}>
              <Typography variant="body2" component="div">
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Date: </Box>{formatDate(confirmDeleteItem.date)}<br />
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Description: </Box>{confirmDeleteItem.description || '—'}<br />
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Amount: </Box>{confirmDeleteItem.amount} HKD
                {confirmDeleteItem.category?.trim() && <><br /><Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>Category: </Box>{confirmDeleteItem.category}</>}
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
          data={personalExpenses}
          emptyMessage="No personal expenses yet. Click Add Entry to create one."
          searchPlaceholder="Search by description, category, vendor, note..."
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
