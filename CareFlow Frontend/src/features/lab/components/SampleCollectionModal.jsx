import { useState, useEffect } from 'react'
import { labApi } from '../api/labApi'
import { X, TestTube2, AlertCircle, CheckCircle2, QrCode } from 'lucide-react'

export default function SampleCollectionModal({ isOpen, onClose, request, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [sampleType, setSampleType] = useState('BLOOD')
  const [collectionSite, setCollectionSite] = useState('Left antecubital fossa')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen && request) {
      // Auto detect sample type from items if available
      if (request.items && request.items.length > 0) {
        setSampleType(request.items[0].sampleType || 'BLOOD')
      } else {
        setSampleType('BLOOD')
      }
      setCollectionSite('Left antecubital fossa')
      setNotes('')
      setError(null)
    }
  }, [isOpen, request])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!request) return

    try {
      setLoading(true)
      setError(null)
      await labApi.collectSample({
        requestId: request.id,
        sampleType,
        collectionSite,
        notes
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Failed to collect sample:', err)
      setError(err.response?.data?.message || 'Failed to record sample collection.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !request) return null

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '600px', width: '95%' }}>
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
              <TestTube2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--secondary)' }}>
                Collect Specimen / Sample
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Record specimen acquisition and register unique laboratory barcode
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
              marginBottom: '1.25rem',
              fontSize: '0.875rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Request Quick Summary Card */}
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Request #
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                {request.requestNumber}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Patient
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)' }}>
                {request.patientName}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {request.patientNumber}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tests Included
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--secondary)' }}>
                {request.testNames?.join(', ') || `${request.itemCount || 0} Test(s)`}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Sample Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Specimen Type <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="BLOOD">Whole Blood (EDTA / Heparin)</option>
                <option value="SERUM">Serum (SST Gel Tube)</option>
                <option value="PLASMA">Plasma (Citrate)</option>
                <option value="URINE">Clean-Catch Urine</option>
                <option value="STOOL">Stool Specimen</option>
                <option value="SWAB">Nasopharyngeal / Throat Swab</option>
                <option value="SPUTUM">Sputum</option>
                <option value="CSF">Cerebrospinal Fluid (CSF)</option>
                <option value="TISSUE">Biopsy / Tissue</option>
                <option value="OTHER">Other Specimen</option>
              </select>
            </div>

            {/* Collection Site */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Anatomical Collection Site
              </label>
              <input
                type="text"
                value={collectionSite}
                onChange={(e) => setCollectionSite(e.target.value)}
                placeholder="E.g., Left antecubital fossa"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {/* Phlebotomy / Handling Notes */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              Phlebotomy & Handling Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Specimen collected without difficulty, no hemolysis, refrigerated immediately..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '0.875rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Barcode Notice */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-subtle)',
            border: '1px solid #bfdbfe'
          }}>
            <QrCode size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>
              A unique laboratory barcode identifier (e.g., <strong>SMP-YYYYMMDD-XXXX</strong>) will be generated and linked for tracking.
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
              {loading ? 'Recording...' : 'Confirm Sample Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
