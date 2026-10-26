import { useState, useEffect } from 'react'
import { labApi } from '../api/labApi'
import { X, FlaskConical, AlertCircle, Save } from 'lucide-react'

export default function LabCatalogModal({ isOpen, onClose, editingTest, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [testCode, setTestCode] = useState('')
  const [testName, setTestName] = useState('')
  const [category, setCategory] = useState('HEMATOLOGY')
  const [sampleType, setSampleType] = useState('BLOOD')
  const [price, setPrice] = useState('1000')
  const [turnaroundTimeHours, setTurnaroundTimeHours] = useState('24')
  const [referenceRange, setReferenceRange] = useState('')
  const [unit, setUnit] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (isOpen) {
      if (editingTest) {
        setTestCode(editingTest.testCode || '')
        setTestName(editingTest.testName || '')
        setCategory(editingTest.category || 'HEMATOLOGY')
        setSampleType(editingTest.sampleType || 'BLOOD')
        setPrice(editingTest.price?.toString() || '1000')
        setTurnaroundTimeHours(editingTest.turnaroundTimeHours?.toString() || '24')
        setReferenceRange(editingTest.referenceRange || '')
        setUnit(editingTest.unit || '')
        setDescription(editingTest.description || '')
        setIsActive(editingTest.isActive !== false)
      } else {
        setTestCode('')
        setTestName('')
        setCategory('HEMATOLOGY')
        setSampleType('BLOOD')
        setPrice('1000')
        setTurnaroundTimeHours('24')
        setReferenceRange('')
        setUnit('')
        setDescription('')
        setIsActive(true)
      }
      setError(null)
    }
  }, [isOpen, editingTest])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!testCode.trim() || !testName.trim()) {
      setError('Test code and test name are required.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const payload = {
        testCode: testCode.trim().toUpperCase(),
        testName: testName.trim(),
        category,
        sampleType,
        price: parseFloat(price) || 0,
        turnaroundTimeHours: parseInt(turnaroundTimeHours) || 24,
        referenceRange: referenceRange.trim(),
        unit: unit.trim(),
        description: description.trim(),
        isActive
      }

      if (editingTest?.id) {
        await labApi.updateTest(editingTest.id, payload)
      } else {
        await labApi.createTest(payload)
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Failed to save laboratory test offering:', err)
      setError(err.response?.data?.message || 'Failed to save test.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '650px', width: '95%' }}>
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
              <FlaskConical size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--secondary)' }}>
                {editingTest ? 'Edit Laboratory Test' : 'Add Test Offering to Catalog'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Configure test code, sample specimen, category, reference intervals & price
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Test Code <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                placeholder="LAB-XXX"
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Test Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="E.g., Complete Blood Count (CBC)"
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Category <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="HEMATOLOGY">Hematology</option>
                <option value="BIOCHEMISTRY">Biochemistry</option>
                <option value="IMMUNOLOGY">Immunology</option>
                <option value="MICROBIOLOGY">Microbiology</option>
                <option value="PATHOLOGY">Pathology</option>
                <option value="URINALYSIS">Urinalysis</option>
                <option value="RADIOLOGY">Radiology</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Specimen / Sample Type <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="BLOOD">Blood</option>
                <option value="SERUM">Serum</option>
                <option value="PLASMA">Plasma</option>
                <option value="URINE">Urine</option>
                <option value="STOOL">Stool</option>
                <option value="SWAB">Swab</option>
                <option value="SPUTUM">Sputum</option>
                <option value="CSF">CSF</option>
                <option value="TISSUE">Tissue</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Charge / Price (LKR) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Turnaround Time (Hours)
              </label>
              <input
                type="number"
                min="1"
                value={turnaroundTimeHours}
                onChange={(e) => setTurnaroundTimeHours(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Reference Range (Normal Interval)
              </label>
              <input
                type="text"
                value={referenceRange}
                onChange={(e) => setReferenceRange(e.target.value)}
                placeholder="E.g., 70 - 99 or Negative"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Measurement Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="E.g., mg/dL, g/dL"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Description & Clinical Indications
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Clinical utility of the test..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '0.85rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <input
              type="checkbox"
              id="is-active-check"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label htmlFor="is-active-check" style={{ fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
              Test active for hospital orders
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Save size={16} />
              {loading ? 'Saving...' : editingTest ? 'Update Test' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
