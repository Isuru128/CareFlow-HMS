import React, { useState, useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, ShoppingCart, Pill, Calendar, Clock, DollarSign, UserCheck } from 'lucide-react'
import { pharmacyApi } from '../api/pharmacyApi'

export default function DispensePrescriptionModal({
  isOpen,
  onClose,
  onDispensed,
  prescription,
  medicines = []
}) {
  const [dispenseItems, setDispenseItems] = useState([])
  const [availableBatchesMap, setAvailableBatchesMap] = useState({})
  const [paymentStatus, setPaymentStatus] = useState('PAID')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (prescription && prescription.items) {
      setError(null)
      setNotes('')
      setPaymentStatus('PAID')

      // Pre-match prescription items with formulary medicines
      const initialItems = prescription.items.map((item) => {
        // Find best match by exact name or substring
        const matchedMed = medicines.find(m =>
          item.medicationName.toLowerCase().includes(m.name.toLowerCase()) ||
          m.name.toLowerCase().includes(item.medicationName.toLowerCase()) ||
          item.medicationName.toLowerCase().includes(m.genericName.toLowerCase())
        ) || (medicines.length > 0 ? medicines[0] : null)

        return {
          prescriptionItemId: item.id,
          medicationName: item.medicationName,
          prescribedQty: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          medicineId: matchedMed ? matchedMed.id : '',
          batchId: '',
          quantity: item.quantity || 1,
          unitPrice: matchedMed ? matchedMed.unitPrice : 0,
          dosageInstructions: `${item.dosage} - ${item.frequency} for ${item.duration}`
        }
      })

      setDispenseItems(initialItems)

      // Fetch available batches for all matched medicines
      const uniqueMedIds = [...new Set(initialItems.map(i => i.medicineId).filter(Boolean))]
      uniqueMedIds.forEach(medId => {
        loadBatchesForMedicine(medId)
      })
    }
  }, [prescription, medicines, isOpen])

  const loadBatchesForMedicine = async (medId) => {
    try {
      const batches = await pharmacyApi.getAvailableBatches(medId)
      setAvailableBatchesMap(prev => ({
        ...prev,
        [medId]: batches
      }))

      // Auto-assign first available batch (FEFO) if not selected
      setDispenseItems(prevItems =>
        prevItems.map(item => {
          if (item.medicineId === medId && !item.batchId && batches.length > 0) {
            return {
              ...item,
              batchId: batches[0].id,
              unitPrice: batches[0].unitSellingPrice || item.unitPrice
            }
          }
          return item
        })
      )
    } catch (err) {
      console.error('Error fetching batches for medicine', medId, err)
    }
  }

  const handleMedicineChange = async (index, newMedId) => {
    const med = medicines.find(m => m.id === Number(newMedId))
    const updated = [...dispenseItems]
    updated[index].medicineId = Number(newMedId)
    updated[index].unitPrice = med ? med.unitPrice : 0
    updated[index].batchId = ''
    setDispenseItems(updated)

    if (newMedId) {
      await loadBatchesForMedicine(Number(newMedId))
    }
  }

  const handleBatchChange = (index, batchId) => {
    const updated = [...dispenseItems]
    const item = updated[index]
    const batches = availableBatchesMap[item.medicineId] || []
    const selectedBatch = batches.find(b => b.id === Number(batchId))

    item.batchId = batchId ? Number(batchId) : ''
    if (selectedBatch && selectedBatch.unitSellingPrice) {
      item.unitPrice = selectedBatch.unitSellingPrice
    }
    setDispenseItems(updated)
  }

  const handleQtyChange = (index, qty) => {
    const updated = [...dispenseItems]
    updated[index].quantity = Number(qty)
    setDispenseItems(updated)
  }

  if (!isOpen || !prescription) return null

  // Calculate grand total
  const grandTotal = dispenseItems.reduce((sum, item) => {
    const q = Number(item.quantity) || 0
    const p = Number(item.unitPrice) || 0
    return sum + (q * p)
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validate selections
    for (let i = 0; i < dispenseItems.length; i++) {
      const item = dispenseItems[i]
      if (!item.medicineId) {
        setError(`Please map formulary medicine for item #${i + 1} (${item.medicationName}).`)
        return
      }
      if (!item.quantity || item.quantity <= 0) {
        setError(`Quantity for item #${i + 1} must be at least 1.`)
        return
      }
      // Check batch quantity if batch selected
      if (item.batchId) {
        const batches = availableBatchesMap[item.medicineId] || []
        const b = batches.find(x => x.id === item.batchId)
        if (b && b.currentQuantity < item.quantity) {
          setError(`Insufficient stock in batch ${b.batchNumber}. Available: ${b.currentQuantity}, Requested: ${item.quantity}`)
          return
        }
      }
    }

    try {
      setLoading(true)
      const payload = {
        prescriptionId: prescription.id,
        paymentStatus,
        notes: notes.trim() || undefined,
        items: dispenseItems.map(item => ({
          prescriptionItemId: item.prescriptionItemId,
          medicineId: item.medicineId,
          batchId: item.batchId || null,
          quantity: item.quantity,
          dosageInstructions: item.dosageInstructions
        }))
      }

      const res = await pharmacyApi.dispensePrescription(payload)
      onDispensed(res)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process and dispense prescription.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>
                Fulfill & Dispense Prescription
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Process Rx #{prescription.prescriptionNumber} for {prescription.patientName}
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
          {/* Prescription Summary Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            padding: '1rem',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1.25rem'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Patient</span>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>
                {prescription.patientName}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{prescription.patientNumber}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prescribing Doctor</span>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>
                Dr. {prescription.doctorName}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Issue Date</span>
              <div style={{ fontWeight: 500, color: '#e2e8f0', fontSize: '0.88rem' }}>
                {prescription.issueDate}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {prescription.status}
                </span>
              </div>
            </div>
          </div>

          {/* Prescribed Items Table / Allocation Grid */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.95rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Pill size={16} color="#38bdf8" />
              Medication Lot Allocation & Dispensing Lines
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dispenseItems.map((item, index) => {
                const batches = availableBatchesMap[item.medicineId] || []
                const itemSubtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)

                return (
                  <div key={index} style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                          Prescribed: {item.medicationName}
                        </span>
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#38bdf8' }}>
                          ({item.dosage} - {item.frequency} for {item.duration})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399' }}>
                        Line Total: LKR {itemSubtotal.toFixed(2)}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 0.7fr 0.8fr', gap: '0.75rem', alignItems: 'center' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                          Formulary Item
                        </label>
                        <select
                          className="form-control"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          value={item.medicineId}
                          onChange={(e) => handleMedicineChange(index, e.target.value)}
                        >
                          <option value="">-- Select Inventory Medicine --</option>
                          {medicines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.medicineCode} - {m.name} ({m.strength}) - Stock: {m.totalStock || 0}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                          Lot / Batch (FEFO Prioritized)
                        </label>
                        <select
                          className="form-control"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          value={item.batchId}
                          onChange={(e) => handleBatchChange(index, e.target.value)}
                        >
                          <option value="">Auto FEFO (Earliest Expiring)</option>
                          {batches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.batchNumber} (Exp: {b.expiryDate} | Avail: {b.currentQuantity})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                          Qty to Dispense
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="form-control"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(index, e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                          Unit Price (LKR)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          readOnly
                          className="form-control"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.2)' }}
                          value={item.unitPrice}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payment & Remarks */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            padding: '1rem',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '1.25rem'
          }}>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Payment Status
              </label>
              <select
                className="form-control"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="PAID">PAID (Settled at Pharmacy Desk)</option>
                <option value="PENDING">PENDING (Forwarded to Hospital Central Billing)</option>
                <option value="WAIVED">WAIVED (Insurance / Internal Scheme)</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Dispensing / Counseling Notes
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Patient instructed on dosage, storage..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Bill Summary Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(56, 189, 248, 0.12))',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Amount to Bill</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#34d399' }}>
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
                disabled={loading || dispenseItems.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <CheckCircle2 size={16} />
                <span>{loading ? 'Fulfilling...' : 'Fulfill & Dispense'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
