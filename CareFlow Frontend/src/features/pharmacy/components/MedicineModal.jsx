import React, { useState, useEffect } from 'react'
import { X, Pill, Save, AlertCircle } from 'lucide-react'

const CATEGORIES = [
  { value: 'ANALGESIC', label: 'Analgesic' },
  { value: 'ANTIBIOTIC', label: 'Antibiotic' },
  { value: 'ANTIHYPERTENSIVE', label: 'Antihypertensive' },
  { value: 'ANTIDIABETIC', label: 'Antidiabetic' },
  { value: 'ANTIHISTAMINE', label: 'Antihistamine' },
  { value: 'ANTIPYRETIC', label: 'Antipyretic' },
  { value: 'GASTROINTESTINAL', label: 'Gastrointestinal' },
  { value: 'CARDIOVASCULAR', label: 'Cardiovascular' },
  { value: 'RESPIRATORY', label: 'Respiratory' },
  { value: 'DERMATOLOGICAL', label: 'Dermatological' },
  { value: 'VITAMINS_SUPPLEMENTS', label: 'Vitamins & Supplements' },
  { value: 'OTHER', label: 'Other' }
]

const DOSAGE_FORMS = [
  { value: 'TABLET', label: 'Tablet' },
  { value: 'CAPSULE', label: 'Capsule' },
  { value: 'SYRUP', label: 'Syrup' },
  { value: 'INJECTION', label: 'Injection' },
  { value: 'SUSPENSION', label: 'Suspension' },
  { value: 'OINTMENT', label: 'Ointment' },
  { value: 'DROPS', label: 'Drops' },
  { value: 'INHALER', label: 'Inhaler' },
  { value: 'SUPPOSITORY', label: 'Suppository' },
  { value: 'OTHER', label: 'Other' }
]

const UNITS_OF_MEASURE = [
  'TABLET', 'CAPSULE', 'BOTTLE', 'STRIP', 'VIAL', 'AMPOULE', 'TUBE', 'BOX', 'PIECE'
]

export default function MedicineModal({ isOpen, onClose, onSave, editingMedicine }) {
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    brandName: '',
    category: 'ANALGESIC',
    dosageForm: 'TABLET',
    strength: '',
    unitOfMeasure: 'TABLET',
    unitPrice: '',
    reorderLevel: 50,
    manufacturer: '',
    storageConditions: 'Store below 25°C in a dry place',
    description: '',
    sideEffects: '',
    isActive: true
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (editingMedicine) {
      setFormData({
        name: editingMedicine.name || '',
        genericName: editingMedicine.genericName || '',
        brandName: editingMedicine.brandName || '',
        category: editingMedicine.category || 'ANALGESIC',
        dosageForm: editingMedicine.dosageForm || 'TABLET',
        strength: editingMedicine.strength || '',
        unitOfMeasure: editingMedicine.unitOfMeasure || 'TABLET',
        unitPrice: editingMedicine.unitPrice || '',
        reorderLevel: editingMedicine.reorderLevel ?? 50,
        manufacturer: editingMedicine.manufacturer || '',
        storageConditions: editingMedicine.storageConditions || 'Store below 25°C in a dry place',
        description: editingMedicine.description || '',
        sideEffects: editingMedicine.sideEffects || '',
        isActive: editingMedicine.isActive ?? true
      })
    } else {
      setFormData({
        name: '',
        genericName: '',
        brandName: '',
        category: 'ANALGESIC',
        dosageForm: 'TABLET',
        strength: '',
        unitOfMeasure: 'TABLET',
        unitPrice: '',
        reorderLevel: 50,
        manufacturer: '',
        storageConditions: 'Store below 25°C in a dry place',
        description: '',
        sideEffects: '',
        isActive: true
      })
    }
    setError(null)
  }, [editingMedicine, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim() || !formData.genericName.trim() || !formData.strength.trim()) {
      setError('Please fill in all required fields (Name, Generic Name, Strength).')
      return
    }

    if (formData.unitPrice === '' || Number(formData.unitPrice) < 0) {
      setError('Unit price must be a non-negative number.')
      return
    }

    try {
      setLoading(true)
      await onSave({
        ...formData,
        unitPrice: Number(formData.unitPrice),
        reorderLevel: Number(formData.reorderLevel)
      })
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save medicine formulary item.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px', width: '92%' }}>
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
              <Pill size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>
                {editingMedicine ? 'Edit Formulary Medicine' : 'Add New Formulary Medicine'}
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {editingMedicine ? `Update details for ${editingMedicine.medicineCode}` : 'Register a new drug into the hospital master inventory'}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Medicine Name *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Paracetamol 500mg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Generic Name (INN) *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Paracetamol"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Brand / Trade Name
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Panadol"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Therapeutic Category *
              </label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Dosage Form *
              </label>
              <select
                className="form-control"
                value={formData.dosageForm}
                onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
              >
                {DOSAGE_FORMS.map((form) => (
                  <option key={form.value} value={form.value}>{form.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Strength / Concentration *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 500 mg, 10 mg/5 ml"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Dispensing Unit *
              </label>
              <select
                className="form-control"
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
              >
                {UNITS_OF_MEASURE.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Standard Unit Price (LKR) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="0.00"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Reorder Threshold Level *
              </label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="50"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Manufacturer / Principal
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. GSK Healthcare"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Storage Conditions
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Store below 25°C away from direct sunlight"
                value={formData.storageConditions}
                onChange={(e) => setFormData({ ...formData, storageConditions: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Clinical Indications & Description
              </label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Brief clinical indications or usage notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                Side Effects & Precautions
              </label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Key contraindications or adverse effects..."
                value={formData.sideEffects}
                onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="isActiveCheck" style={{ fontSize: '0.85rem', color: '#e2e8f0', cursor: 'pointer' }}>
              Formulary Item Active for Prescribing & Dispensing
            </label>
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
              <span>{loading ? 'Saving...' : editingMedicine ? 'Update Medicine' : 'Save Medicine'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
