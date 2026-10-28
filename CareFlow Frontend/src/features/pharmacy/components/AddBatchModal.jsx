import React, { useState, useEffect } from 'react'
import { X, Layers, Save, AlertCircle } from 'lucide-react'

export default function AddBatchModal({ isOpen, onClose, onSave, medicines = [], defaultMedicineId = null }) {
  const [formData, setFormData] = useState({
    medicineId: '',
    batchNumber: '',
    manufactureDate: '',
    expiryDate: '',
    initialQuantity: '',
    unitPurchasePrice: '',
    unitSellingPrice: '',
    supplierName: '',
    receivedDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (defaultMedicineId) {
      const selectedMed = medicines.find(m => m.id === defaultMedicineId)
      setFormData(prev => ({
        ...prev,
        medicineId: defaultMedicineId,
        unitSellingPrice: selectedMed ? selectedMed.unitPrice : ''
      }))
    } else if (medicines.length > 0 && !formData.medicineId) {
      setFormData(prev => ({
        ...prev,
        medicineId: medicines[0].id,
        unitSellingPrice: medicines[0].unitPrice || ''
      }))
    }
  }, [defaultMedicineId, medicines, isOpen])

  if (!isOpen) return null

  const handleMedicineChange = (medId) => {
    const selectedMed = medicines.find(m => m.id === Number(medId))
    setFormData({
      ...formData,
      medicineId: medId,
      unitSellingPrice: selectedMed ? selectedMed.unitPrice : ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.medicineId || !formData.batchNumber.trim() || !formData.expiryDate || !formData.initialQuantity) {
      setError('Please provide Medicine, Batch Number, Expiry Date, and Received Quantity.')
      return
    }

    if (Number(formData.initialQuantity) <= 0) {
      setError('Initial quantity must be greater than 0.')
      return
    }

    try {
      setLoading(true)
      await onSave({
        medicineId: Number(formData.medicineId),
        batchNumber: formData.batchNumber.trim(),
        manufactureDate: formData.manufactureDate || null,
        expiryDate: formData.expiryDate,
        initialQuantity: Number(formData.initialQuantity),
        unitPurchasePrice: formData.unitPurchasePrice ? Number(formData.unitPurchasePrice) : 0,
        unitSellingPrice: formData.unitSellingPrice ? Number(formData.unitSellingPrice) : 0,
        supplierName: formData.supplierName.trim() || null,
        receivedDate: formData.receivedDate || new Date().toISOString().split('T')[0],
        notes: formData.notes.trim() || null
      })
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add batch.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px', width: '92%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>
                Receive Stock Consignment / Batch
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Add physical lot stock with expiration tracking and FEFO allocation
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Select Medicine *
              </label>
              <select
                className="form-control"
                value={formData.medicineId}
                onChange={(e) => handleMedicineChange(e.target.value)}
                required
              >
                <option value="">-- Choose Formulary Item --</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.medicineCode} - {m.name} ({m.strength}) - Current: {m.totalStock || 0}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Batch / Lot Number *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. BAT-2026-009"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Quantity Received (Units) *
              </label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="e.g. 500"
                value={formData.initialQuantity}
                onChange={(e) => setFormData({ ...formData, initialQuantity: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Manufacture Date
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.manufactureDate}
                onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Expiry Date *
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Purchase Cost / Unit (LKR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="0.00"
                value={formData.unitPurchasePrice}
                onChange={(e) => setFormData({ ...formData, unitPurchasePrice: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Selling Price / Unit (LKR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="0.00"
                value={formData.unitSellingPrice}
                onChange={(e) => setFormData({ ...formData, unitSellingPrice: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Supplier Name
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. State Pharmaceuticals Corp"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Date Received
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.receivedDate}
                onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Notes / Inspection Remarks
              </label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Consignment notes, storage bay, PO reference..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
              <span>{loading ? 'Receiving...' : 'Confirm Receipt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
