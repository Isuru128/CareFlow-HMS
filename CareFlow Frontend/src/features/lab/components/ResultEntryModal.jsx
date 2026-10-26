import { useState, useEffect } from 'react'
import { labApi } from '../api/labApi'
import { ResultFlagBadge } from './LabStatusBadge'
import { X, ClipboardCheck, Plus, Trash2, AlertCircle, Save, CheckCircle2 } from 'lucide-react'

// Common template defaults by testCode for rapid clinical entry
const TEST_TEMPLATES = {
  'LAB-CBC': [
    { parameterName: 'Hemoglobin', resultValue: '', referenceRange: '13.0 - 17.0', unit: 'g/dL', flag: 'NORMAL', notes: '' },
    { parameterName: 'White Blood Cells (WBC)', resultValue: '', referenceRange: '4,500 - 11,000', unit: '/uL', flag: 'NORMAL', notes: '' },
    { parameterName: 'Platelets', resultValue: '', referenceRange: '150,000 - 450,000', unit: '/uL', flag: 'NORMAL', notes: '' },
    { parameterName: 'Hematocrit (PCV)', resultValue: '', referenceRange: '40.0 - 52.0', unit: '%', flag: 'NORMAL', notes: '' }
  ],
  'LAB-FBS': [
    { parameterName: 'Fasting Blood Glucose', resultValue: '', referenceRange: '70.0 - 99.0', unit: 'mg/dL', flag: 'NORMAL', notes: '' }
  ],
  'LAB-LIPID': [
    { parameterName: 'Total Cholesterol', resultValue: '', referenceRange: '< 200.0', unit: 'mg/dL', flag: 'NORMAL', notes: '' },
    { parameterName: 'Triglycerides', resultValue: '', referenceRange: '< 150.0', unit: 'mg/dL', flag: 'NORMAL', notes: '' },
    { parameterName: 'HDL Cholesterol', resultValue: '', referenceRange: '> 40.0', unit: 'mg/dL', flag: 'NORMAL', notes: '' },
    { parameterName: 'LDL Cholesterol', resultValue: '', referenceRange: '< 100.0', unit: 'mg/dL', flag: 'NORMAL', notes: '' }
  ],
  'LAB-LFT': [
    { parameterName: 'SGOT / AST', resultValue: '', referenceRange: '15 - 40', unit: 'U/L', flag: 'NORMAL', notes: '' },
    { parameterName: 'SGPT / ALT', resultValue: '', referenceRange: '10 - 49', unit: 'U/L', flag: 'NORMAL', notes: '' },
    { parameterName: 'Total Bilirubin', resultValue: '', referenceRange: '0.2 - 1.2', unit: 'mg/dL', flag: 'NORMAL', notes: '' },
    { parameterName: 'Alkaline Phosphatase (ALP)', resultValue: '', referenceRange: '44 - 147', unit: 'U/L', flag: 'NORMAL', notes: '' }
  ],
  'LAB-CREAT': [
    { parameterName: 'Serum Creatinine', resultValue: '', referenceRange: '0.7 - 1.3', unit: 'mg/dL', flag: 'NORMAL', notes: '' },
    { parameterName: 'Estimated GFR (eGFR)', resultValue: '', referenceRange: '> 60', unit: 'mL/min/1.73m²', flag: 'NORMAL', notes: '' }
  ],
  'LAB-HBA1C': [
    { parameterName: 'Glycated Hemoglobin (HbA1c)', resultValue: '', referenceRange: '4.0 - 5.6', unit: '%', flag: 'NORMAL', notes: '' }
  ],
  'LAB-URINE': [
    { parameterName: 'Urine Appearance', resultValue: 'Clear', referenceRange: 'Clear', unit: '', flag: 'NORMAL', notes: '' },
    { parameterName: 'pH', resultValue: '6.0', referenceRange: '5.0 - 8.0', unit: '', flag: 'NORMAL', notes: '' },
    { parameterName: 'Specific Gravity', resultValue: '1.015', referenceRange: '1.005 - 1.030', unit: '', flag: 'NORMAL', notes: '' },
    { parameterName: 'Protein', resultValue: 'Negative', referenceRange: 'Negative', unit: '', flag: 'NORMAL', notes: '' },
    { parameterName: 'Glucose', resultValue: 'Negative', referenceRange: 'Negative', unit: '', flag: 'NORMAL', notes: '' }
  ],
  'LAB-TSH': [
    { parameterName: 'Thyroid Stimulating Hormone (TSH)', resultValue: '', referenceRange: '0.40 - 4.50', unit: 'uIU/mL', flag: 'NORMAL', notes: '' }
  ],
  'LAB-CRP': [
    { parameterName: 'C-Reactive Protein (Quantitative)', resultValue: '', referenceRange: '< 5.0', unit: 'mg/L', flag: 'NORMAL', notes: '' }
  ],
  'LAB-COVID': [
    { parameterName: 'SARS-CoV-2 Antigen', resultValue: 'Negative', referenceRange: 'Negative', unit: '', flag: 'NORMAL', notes: '' }
  ]
}

export default function ResultEntryModal({ isOpen, onClose, requestId, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const [requestDetail, setRequestDetail] = useState(null)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [parameters, setParameters] = useState([])

  useEffect(() => {
    if (isOpen && requestId) {
      loadRequestDetail()
    } else {
      setRequestDetail(null)
      setSelectedItemId(null)
      setParameters([])
      setError(null)
      setSuccessMessage(null)
    }
  }, [isOpen, requestId])

  const loadRequestDetail = async () => {
    try {
      setLoading(true)
      const data = await labApi.getRequestById(requestId)
      setRequestDetail(data)

      if (data.items && data.items.length > 0) {
        selectItem(data.items[0], data)
      }
    } catch (err) {
      console.error('Failed to load request details for result entry:', err)
      setError('Failed to load test details.')
    } finally {
      setLoading(false)
    }
  }

  const selectItem = (item, currentDetail = requestDetail) => {
    setSelectedItemId(item.id)
    setSuccessMessage(null)

    // If item already has results entered
    if (item.results && item.results.length > 0) {
      setParameters(item.results.map(r => ({
        parameterName: r.parameterName,
        resultValue: r.resultValue,
        referenceRange: r.referenceRange || '',
        unit: r.unit || '',
        flag: r.flag || 'NORMAL',
        notes: r.notes || ''
      })))
    } else {
      // Use template defaults if available
      const template = TEST_TEMPLATES[item.testCode]
      if (template) {
        setParameters(template.map(t => ({ ...t })))
      } else {
        setParameters([{
          parameterName: item.testName || 'Result',
          resultValue: '',
          referenceRange: '',
          unit: '',
          flag: 'NORMAL',
          notes: ''
        }])
      }
    }
  }

  const handleParamChange = (index, field, value) => {
    setParameters(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addParameterRow = () => {
    setParameters(prev => [
      ...prev,
      {
        parameterName: '',
        resultValue: '',
        referenceRange: '',
        unit: '',
        flag: 'NORMAL',
        notes: ''
      }
    ])
  }

  const removeParameterRow = (index) => {
    setParameters(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveResults = async (e) => {
    e.preventDefault()
    if (!selectedItemId) return

    const validParams = parameters.filter(p => p.parameterName.trim() && p.resultValue.trim())
    if (validParams.length === 0) {
      setError('Please provide at least one valid parameter name and result value.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      await labApi.enterResults({
        requestItemId: selectedItemId,
        results: validParams
      })

      setSuccessMessage('Results successfully recorded!')
      // Refresh request details to update status
      const updated = await labApi.getRequestById(requestId)
      setRequestDetail(updated)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to save laboratory results:', err)
      setError(err.response?.data?.message || 'Failed to save test results.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const selectedItem = requestDetail?.items?.find(i => i.id === selectedItemId)

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '920px', width: '96%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--secondary)' }}>
                Laboratory Results Entry
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Enter quantitative & qualitative parameters, flag critical abnormal values
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

        {/* Content Body */}
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

          {successMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading request details...
            </div>
          ) : requestDetail ? (
            <>
              {/* Patient Banner */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '0.85rem 1.25rem',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patient Demographics:</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--secondary)' }}>
                    {requestDetail.patientName} ({requestDetail.patientGender}, {requestDetail.patientAge} yrs)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                    ID: {requestDetail.patientNumber} | Req: {requestDetail.requestNumber}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Requesting Physician:</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--secondary)' }}>
                    {requestDetail.doctorName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Priority: <strong>{requestDetail.priority}</strong>
                  </div>
                </div>
              </div>

              {/* Test Item Tabs */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                  Select Test Item to Record Findings:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {requestDetail.items?.map(item => {
                    const isSelected = item.id === selectedItemId
                    const isDone = item.status === 'COMPLETED'
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => selectItem(item)}
                        style={{
                          padding: '0.5rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'var(--primary-subtle)' : '#ffffff',
                          color: isSelected ? 'var(--primary-dark)' : 'var(--secondary)'
                        }}
                      >
                        {isDone ? (
                          <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                        ) : (
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
                        )}
                        <span>{item.testName}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({item.testCode})</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Parameters Table Form */}
              {selectedItem && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f1f5f9',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>
                        {selectedItem.testName}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        Specimen: {selectedItem.sampleType} | Cat: {selectedItem.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={addParameterRow}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: 'var(--primary)'
                      }}
                    >
                      <Plus size={14} /> Add Parameter
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '0.6rem 0.75rem', width: '28%' }}>Parameter Name</th>
                          <th style={{ padding: '0.6rem 0.75rem', width: '18%' }}>Result Value</th>
                          <th style={{ padding: '0.6rem 0.75rem', width: '12%' }}>Unit</th>
                          <th style={{ padding: '0.6rem 0.75rem', width: '18%' }}>Reference Interval</th>
                          <th style={{ padding: '0.6rem 0.75rem', width: '16%' }}>Flag</th>
                          <th style={{ padding: '0.6rem 0.5rem', width: '8%', textAlign: 'center' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {parameters.map((param, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <input
                                type="text"
                                value={param.parameterName}
                                onChange={(e) => handleParamChange(idx, 'parameterName', e.target.value)}
                                placeholder="E.g., Hemoglobin"
                                required
                                style={{
                                  width: '100%',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border)',
                                  fontSize: '0.8rem'
                                }}
                              />
                            </td>

                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <input
                                type="text"
                                value={param.resultValue}
                                onChange={(e) => handleParamChange(idx, 'resultValue', e.target.value)}
                                placeholder="E.g., 14.5"
                                required
                                style={{
                                  width: '100%',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border)',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  color: param.flag === 'CRITICAL' ? 'var(--danger)' : param.flag === 'HIGH' ? '#c2410c' : param.flag === 'LOW' ? 'var(--primary)' : 'inherit'
                                }}
                              />
                            </td>

                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <input
                                type="text"
                                value={param.unit}
                                onChange={(e) => handleParamChange(idx, 'unit', e.target.value)}
                                placeholder="g/dL"
                                style={{
                                  width: '100%',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border)',
                                  fontSize: '0.8rem'
                                }}
                              />
                            </td>

                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <input
                                type="text"
                                value={param.referenceRange}
                                onChange={(e) => handleParamChange(idx, 'referenceRange', e.target.value)}
                                placeholder="13.0 - 17.0"
                                style={{
                                  width: '100%',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border)',
                                  fontSize: '0.8rem'
                                }}
                              />
                            </td>

                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <select
                                value={param.flag}
                                onChange={(e) => handleParamChange(idx, 'flag', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem 0.5rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border)',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  backgroundColor: '#ffffff'
                                }}
                              >
                                <option value="NORMAL">NORMAL</option>
                                <option value="LOW">LOW</option>
                                <option value="HIGH">HIGH</option>
                                <option value="CRITICAL">CRITICAL</option>
                                <option value="ABNORMAL">ABNORMAL</option>
                              </select>
                            </td>

                            <td style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>
                              {parameters.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeParameterRow(idx)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--danger)',
                                    cursor: 'pointer',
                                    padding: '4px'
                                  }}
                                  title="Remove parameter"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={saving}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSaveResults}
            className="btn btn-primary"
            disabled={saving || !selectedItemId || parameters.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save & Validate Results'}
          </button>
        </div>
      </div>
    </div>
  )
}
