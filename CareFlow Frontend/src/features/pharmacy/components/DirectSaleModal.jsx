import React, { useState } from 'react'
import { X, Plus, Trash2, ShoppingBag, DollarSign, AlertCircle, Save } from 'lucide-react'
import { pharmacyApi } from '../api/pharmacyApi'

export default function DirectSaleModal({
  isOpen,
  onClose,
  onSaleCompleted,
  medicines = []
}) {
  const [patientName, setPatientName] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('PAID')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([
    { medicineId: '', batchId: '', quantity: 1, unitPrice: 0, dosageInstructions: '' }
  ])
  const [availableBatchesMap, setAvailableBatchesMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const loadBatchesForMedicine = async (medId) => {
    try {
      const batches = await pharmacyApi.getAvailableBatches(medId)
      setAvailableBatchesMap(prev => ({
        ...prev,
        [medId]: batches
      }))
    } catch (err) {
      console.error('Error fetching batches', err)
    }
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      { medicineId: '', batchId: '', quantity: 1, unitPrice: 0, dosageInstructions: '' }
    ])
  }

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleMedicineChange = async (index, medId) => {
    const med = medicines.find(m => m.id === Number(medId))
    const updated = [...items]
    updated[index].medicineId = medId ? Number(medId) : ''
    updated[index].unitPrice = med ? med.unitPrice : 0
    updated[index].batchId = ''
    setItems(updated)

    if (medId) {
      await loadBatchesForMedicine(Number(medId))
    }
  }

  const handleBatchChange = (index, batchId) => {
    const updated = [...items]
    const item = updated[index]
    const batches = availableBatchesMap[item.medicineId] || []
    const b = batches.find(x => x.id === Number(batchId))

    item.batchId = batchId ? Number(batchId) : ''
    if (b && b.unitSellingPrice) {
      item.unitPrice = b.unitSellingPrice
    }
    setItems(updated)
  }

  const handleQuantityChange = (index, qty) => {
    const updated = [...items]
    updated[index].quantity = Number(qty)
    setItems(updated)
  }

  const grandTotal = items.reduce((sum, item) => {
    const q = Number(item.quantity) || 0
    const p = Number(item.unitPrice) || 0
    return sum + (q * p)
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!patientName.trim()) {
      setError('Please provide customer or patient name.')
      return
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.medicineId) {
        setError(`Please select a medicine for line #${i + 1}.`)
        return
      }
      if (!item.quantity || item.quantity <= 0) {
        setError(`Quantity for line #${i + 1} must be at least 1.`)
        return
      }
    }

    try {
      setLoading(true)
      const payload = {
        patientName: patientName.trim(),
        doctorName: doctorName.trim() || undefined,
        paymentStatus,
        notes: notes.trim() || undefined,
        items: items.map(i => ({
          medicineId: i.medicineId,
          batchId: i.batchId || null,
          quantity: i.quantity,
          dosageInstructions: i.dosageInstructions || undefined
        }))
      }

      const res = await pharmacyApi.processDirectSale(payload)
      onSaleCompleted(res)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete direct sale.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>
                Walk-In / Over-The-Counter (OTC) Sale
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Direct counter dispensing without an electronic hospital prescription
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            margin: '1rem 1.5rem 0',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Customer / Patient Name *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Kasun Perera"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                External Prescriber / Doctor (Optional)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Dr. Silva"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#e2e8f0' }}>
                Medicines to Issue
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {items.map((item, index) => {
                const batches = availableBatchesMap[item.medicineId] || []
                const subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)

                return (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 0.8fr 0.9fr 0.9fr 40px',
                    gap: '0.6rem',
                    alignItems: 'center',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div>
                      <select
                        className="form-control"
                        style={{ fontSize: '0.8rem' }}
                        value={item.medicineId}
                        onChange={(e) => handleMedicineChange(index, e.target.value)}
                        required
                      >
                        <option value="">-- Select Medicine --</option>
                        {medicines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.strength}) - Stock: {m.totalStock || 0}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        className="form-control"
                        style={{ fontSize: '0.8rem' }}
                        value={item.batchId}
                        onChange={(e) => handleBatchChange(index, e.target.value)}
                      >
                        <option value="">Auto FEFO (Earliest Expiring)</option>
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.batchNumber} (Avail: {b.currentQuantity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        style={{ fontSize: '0.8rem' }}
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        readOnly
                        className="form-control"
                        style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}
                        value={item.unitPrice}
                      />
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399', textAlign: 'right' }}>
                      LKR {subtotal.toFixed(2)}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: items.length === 1 ? '#64748b' : '#f87171',
                          cursor: items.length === 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Payment Method / Settlement
              </label>
              <select
                className="form-control"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="PAID">PAID (Cash / Card at Pharmacy Desk)</option>
                <option value="PENDING">PENDING (Pay at Discharge)</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Sale Notes
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Walk-in counter sale remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(16, 185, 129, 0.12))',
            border: '1px solid rgba(56, 189, 248, 0.25)'
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Net Amount Due</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8' }}>
                LKR {grandTotal.toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={16} />
                <span>{loading ? 'Processing...' : 'Complete Sale & Print'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
