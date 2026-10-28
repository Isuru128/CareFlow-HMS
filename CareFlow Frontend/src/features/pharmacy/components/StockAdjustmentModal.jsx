import React, { useState, useEffect } from 'react'
import { X, RefreshCw, Save, AlertCircle } from 'lucide-react'

const ADJUSTMENT_REASONS = [
  'PHYSICAL_COUNT_RECONCILIATION',
  'DAMAGED_OR_BROKEN_GOODS',
  'LEAKAGE_OR_CONTAINER_FAULT',
  'SUPPLIER_RETURN',
  'AUDIT_CORRECTION',
  'OTHER'
]

export default function StockAdjustmentModal({ isOpen, onClose, onSave, batch }) {
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0)
  const [reason, setReason] = useState('PHYSICAL_COUNT_RECONCILIATION')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setAdjustmentQuantity(0)
    setReason('PHYSICAL_COUNT_RECONCILIATION')
    setNotes('')
    setError(null)
  }, [batch, isOpen])

  if (!isOpen || !batch) return null

  const currentStock = batch.currentQuantity ?? 0
  const resultingStock = currentStock + Number(adjustmentQuantity || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const qty = Number(adjustmentQuantity)
    if (qty === 0) {
      setError('Adjustment quantity cannot be 0.')
      return
    }

    if (resultingStock < 0) {
      setError(`Cannot deduct ${Math.abs(qty)} units. Current stock is only ${currentStock}.`)
      return
    }

    try {
      setLoading(true)
      await onSave({
        batchId: batch.id,
        adjustmentQuantity: qty,
        reason,
        notes: notes.trim() || undefined
      })
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to adjust stock.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px', width: '92%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>
                Stock Quantity Adjustment
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Reconcile physical inventory counts and record audit adjustments
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
          <div style={{
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1.2rem'
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target Batch Details:</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ffffff', marginTop: '0.2rem' }}>
              {batch.medicineName} ({batch.medicineStrength})
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.4rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
              <span>Batch: <strong style={{ color: '#38bdf8' }}>{batch.batchNumber}</strong></span>
              <span>Expires: <strong style={{ color: '#cbd5e1' }}>{batch.expiryDate}</strong></span>
              <span>Current Stock: <strong style={{ color: '#34d399' }}>{currentStock}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Adjustment Delta Quantity *
              </label>
              <input
                type="number"
                className="form-control"
                placeholder="Enter positive to add (+5), or negative to subtract (-3)"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                required
              />
              <div style={{
                marginTop: '0.4rem',
                fontSize: '0.8rem',
                color: resultingStock < 0 ? '#f87171' : 'var(--text-muted)'
              }}>
                Current Stock: <strong>{currentStock}</strong> &rarr; Resulting Stock: <strong style={{ color: resultingStock < 0 ? '#f87171' : '#38bdf8' }}>{resultingStock}</strong>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Adjustment Reason *
              </label>
              <select
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {ADJUSTMENT_REASONS.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Notes / Audit Justification
              </label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Specific comments or verification notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              disabled={loading || resultingStock < 0}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Save size={16} />
              <span>{loading ? 'Applying...' : 'Apply Stock Adjustment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
