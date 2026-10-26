import { useState, useEffect } from 'react'
import { labApi } from '../api/labApi'
import { X, Search, Check, AlertCircle, PlusCircle, FlaskConical, DollarSign, Clock } from 'lucide-react'

export default function CreateLabRequestModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Reference data
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [testCatalog, setTestCatalog] = useState([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)

  // Form state
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [priority, setPriority] = useState('ROUTINE')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [selectedTestIds, setSelectedTestIds] = useState([])
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogCategory, setCatalogCategory] = useState('ALL')

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    } else {
      // Reset state
      setPatientId('')
      setDoctorId('')
      setPriority('ROUTINE')
      setClinicalNotes('')
      setSelectedTestIds([])
      setCatalogSearch('')
      setCatalogCategory('ALL')
      setError(null)
    }
  }, [isOpen])

  const loadInitialData = async () => {
    try {
      setLoadingCatalog(true)
      const [patientsRes, doctorsRes, testsRes] = await Promise.all([
        labApi.searchPatients(''),
        labApi.getDoctors(),
        labApi.getActiveTests()
      ])
      setPatients(patientsRes || [])
      setDoctors(doctorsRes || [])
      setTestCatalog(testsRes || [])
    } catch (err) {
      console.error('Failed to load lab request form references:', err)
      setError('Failed to load patients, doctors, or test catalog.')
    } finally {
      setLoadingCatalog(false)
    }
  }

  const toggleTest = (testId) => {
    setSelectedTestIds(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    )
  }

  const filteredTests = testCatalog.filter(test => {
    const matchesCategory = catalogCategory === 'ALL' || test.category === catalogCategory
    const matchesSearch = !catalogSearch.trim() ||
      test.testName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      test.testCode.toLowerCase().includes(catalogSearch.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const selectedTests = testCatalog.filter(t => selectedTestIds.includes(t.id))
  const totalCost = selectedTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!patientId) {
      setError('Please select a patient.')
      return
    }
    if (selectedTestIds.length === 0) {
      setError('Please select at least one laboratory test to request.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await labApi.createRequest({
        patientId: Number(patientId),
        doctorId: doctorId ? Number(doctorId) : null,
        priority,
        clinicalNotes,
        testIds: selectedTestIds
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Failed to submit lab request:', err)
      setError(err.response?.data?.message || 'Failed to create laboratory test request.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
              <FlaskConical size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--secondary)' }}>
                New Laboratory Test Request
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Order diagnostic tests and generate clinical investigation requisitions
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
        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
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

          <form id="lab-request-form" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* Patient */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Patient <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
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
                  <option value="">-- Select Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.patientNumber} - {p.firstName} {p.lastName} ({p.gender}, {p.contactNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Requesting Doctor */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Requesting Physician
                </label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">-- Direct Hospital Order / General --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Priority Level <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { id: 'ROUTINE', label: 'Routine', color: '#475569', bg: '#f1f5f9' },
                    { id: 'URGENT', label: 'Urgent', color: '#c2410c', bg: '#ffedd5' },
                    { id: 'STAT', label: 'STAT (Immediate)', color: '#b91c1c', bg: '#fee2e2' }
                  ].map(p => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPriority(p.id)}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.6rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: priority === p.id ? `2px solid ${p.color}` : '1px solid var(--border)',
                        backgroundColor: priority === p.id ? p.bg : '#ffffff',
                        color: priority === p.id ? p.color : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clinical Notes */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Clinical Indication / Diagnosis Notes
              </label>
              <textarea
                rows={2}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="E.g., Pre-operative evaluation, uncontrolled hypertension, follow-up fasting lipid..."
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

            {/* Test Selection Catalog */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', backgroundColor: '#fbfcfd', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--secondary)' }}>
                    Select Diagnostic Tests ({selectedTestIds.length} Selected)
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Choose one or more laboratory tests to include in this investigation
                  </span>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search tests..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      style={{
                        padding: '0.35rem 0.6rem 0.35rem 1.6rem',
                        fontSize: '0.8rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        width: '150px'
                      }}
                    />
                  </div>

                  <select
                    value={catalogCategory}
                    onChange={(e) => setCatalogCategory(e.target.value)}
                    style={{
                      padding: '0.35rem 0.6rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="ALL">All Categories</option>
                    <option value="HEMATOLOGY">Hematology</option>
                    <option value="BIOCHEMISTRY">Biochemistry</option>
                    <option value="IMMUNOLOGY">Immunology</option>
                    <option value="MICROBIOLOGY">Microbiology</option>
                    <option value="URINALYSIS">Urinalysis</option>
                  </select>
                </div>
              </div>

              {/* Tests Grid */}
              {loadingCatalog ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Loading laboratory test directory...
                </div>
              ) : filteredTests.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No matching laboratory tests found.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                  gap: '0.65rem',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {filteredTests.map(test => {
                    const isSelected = selectedTestIds.includes(test.id)
                    return (
                      <div
                        key={test.id}
                        onClick={() => toggleTest(test.id)}
                        style={{
                          padding: '0.65rem 0.75rem',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'var(--primary-subtle)' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                          transition: 'all 0.15s ease',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-dark)', letterSpacing: '0.04em' }}>
                            {test.testCode}
                          </span>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                            backgroundColor: isSelected ? 'var(--primary)' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff'
                          }}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>

                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--secondary)' }}>
                          {test.testName}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {test.sampleType}
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary)' }}>
                            LKR {Number(test.price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Total & Summary bar */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Clock size={14} />
                  <span>Sample collection immediately following request submission</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimated Lab Total:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                    LKR {totalCost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
            form="lab-request-form"
            className="btn btn-primary"
            disabled={loading || selectedTestIds.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {loading ? 'Creating...' : `Order Tests (${selectedTestIds.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
