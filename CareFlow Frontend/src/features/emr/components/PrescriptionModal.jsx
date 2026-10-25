import { useState, useEffect } from 'react'
import { emrApi } from '../api/emrApi'
import { patientApi } from '../../patients/api/patientApi'
import { doctorApi } from '../../doctors/api/doctorApi'
import { X, Pill, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'

export default function PrescriptionModal({ isOpen, onClose, onSaved, defaultPatientId }) {
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [instructions, setInstructions] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([
    {
      medicationName: '',
      dosage: '',
      frequency: 'Once Daily (OD)',
      route: 'ORAL',
      duration: '7 Days',
      quantity: 1,
      instructions: ''
    }
  ])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadMetadata()
      setPatientId(defaultPatientId || '')
      setIssueDate(new Date().toISOString().split('T')[0])
      setValidUntil(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      setInstructions('')
      setNotes('')
      setItems([
        {
          medicationName: '',
          dosage: '',
          frequency: 'Once Daily (OD)',
          route: 'ORAL',
          duration: '7 Days',
          quantity: 1,
          instructions: ''
        }
      ])
    }
  }, [isOpen, defaultPatientId])

  const loadMetadata = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        patientApi.getPatients({ size: 100 }),
        doctorApi.getActiveDoctorsSummary()
      ])
      setPatients(patRes?.content || [])
      setDoctors(docRes || [])
      if (docRes && docRes.length > 0 && !doctorId) {
        setDoctorId(docRes[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  const addItemRow = () => {
    setItems([
      ...items,
      {
        medicationName: '',
        dosage: '',
        frequency: 'Once Daily (OD)',
        route: 'ORAL',
        duration: '7 Days',
        quantity: 1,
        instructions: ''
      }
    ])
  }

  const removeItemRow = (index) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!patientId) {
      setError('Please select a patient.')
      return
    }
    if (!doctorId) {
      setError('Please select a prescribing doctor.')
      return
    }

    const validItems = items.filter((it) => it.medicationName.trim() && it.dosage.trim())
    if (validItems.length === 0) {
      setError('Please provide at least one medication with name and dosage.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      await emrApi.createPrescription({
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        issueDate,
        validUntil: validUntil || null,
        status: 'ACTIVE',
        instructions: instructions.trim() || null,
        notes: notes.trim() || null,
        items: validItems.map((it) => ({
          ...it,
          quantity: parseInt(it.quantity) || 1
        }))
      })

      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue prescription.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="modal-container"
        style={{
          maxWidth: '820px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Pill size={22} />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>New Prescription Order</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Patient <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="">-- Select Patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.patientNumber} - {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Prescribing Doctor <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="">-- Select Doctor --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.firstName} {d.lastName} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Medications Builder */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-main)', letterSpacing: '0.04em' }}>
                Medication Items
              </span>
              <button
                type="button"
                onClick={addItemRow}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Add Drug
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {items.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1.2fr 1fr 0.8fr auto',
                    gap: '0.5rem',
                    alignItems: 'center',
                    padding: '0.6rem',
                    background: 'var(--surface-alt)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <input
                    type="text"
                    required
                    placeholder="Medicine Name (e.g. Paracetamol 500mg)"
                    value={it.medicationName}
                    onChange={(e) => handleItemChange(idx, 'medicationName', e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Dosage (500mg)"
                    value={it.dosage}
                    onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <select
                    value={it.frequency}
                    onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  >
                    <option value="Once Daily (OD)">Once Daily (OD)</option>
                    <option value="Twice Daily (BD)">Twice Daily (BD)</option>
                    <option value="Three Times Daily (TDS)">Three Times Daily (TDS)</option>
                    <option value="Four Times Daily (QDS)">Four Times Daily (QDS)</option>
                    <option value="As Needed (PRN)">As Needed (PRN)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Duration (e.g. 5 Days)"
                    value={it.duration}
                    onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length === 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: items.length === 1 ? '#cbd5e1' : 'var(--danger)',
                      cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                      padding: '0.35rem'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Patient Usage Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Take with plenty of water after main meals"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.55rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: '#ffffff', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.55rem 1.35rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--success)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Issue Prescription
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
