import { useState, useEffect } from 'react'
import { labApi } from '../api/labApi'
import { ReportStatusBadge, PriorityBadge, ResultFlagBadge } from './LabStatusBadge'
import { X, FileText, Printer, CheckCircle, AlertCircle, ShieldCheck, UserCheck, Calendar } from 'lucide-react'

export default function LabReportModal({ isOpen, onClose, requestId, reportId, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [reportDetail, setReportDetail] = useState(null)

  // Report creation/edit fields
  const [isCreating, setIsCreating] = useState(false)
  const [summary, setSummary] = useState('')
  const [comments, setComments] = useState('')
  const [finalizeNow, setFinalizeNow] = useState(true)

  useEffect(() => {
    if (isOpen) {
      if (reportId) {
        loadReportById(reportId)
      } else if (requestId) {
        loadReportByRequestId(requestId)
      }
    } else {
      setReportDetail(null)
      setIsCreating(false)
      setSummary('')
      setComments('')
      setError(null)
    }
  }, [isOpen, requestId, reportId])

  const loadReportById = async (id) => {
    try {
      setLoading(true)
      const data = await labApi.getReportById(id)
      setReportDetail(data)
      setIsCreating(false)
    } catch (err) {
      console.error('Failed to load report by id:', err)
      setError('Failed to load diagnostic report.')
    } finally {
      setLoading(false)
    }
  }

  const loadReportByRequestId = async (reqId) => {
    try {
      setLoading(true)
      // Check if report already exists for request
      try {
        const data = await labApi.getReportByRequestId(reqId)
        setReportDetail(data)
        setIsCreating(false)
      } catch (notFound) {
        // Report not generated yet -> open creation form
        setIsCreating(true)
        const reqData = await labApi.getRequestById(reqId)
        setReportDetail({
          requestId: reqData.id,
          requestNumber: reqData.requestNumber,
          priority: reqData.priority,
          requestedAt: reqData.requestedAt,
          patientId: reqData.patientId,
          patientNumber: reqData.patientNumber,
          patientName: reqData.patientName,
          patientGender: reqData.patientGender,
          patientAge: reqData.patientAge,
          patientContact: reqData.patientContact,
          doctorId: reqData.doctorId,
          doctorName: reqData.doctorName,
          doctorSpecialization: reqData.doctorSpecialization,
          items: reqData.items || [],
          samples: reqData.samples || []
        })

        // Pre-fill default summary based on test items
        const testList = reqData.items?.map(i => i.testName).join(', ')
        setSummary(`Diagnostic evaluation completed for ${testList || 'requested laboratory panel'}. Parameters reviewed against hospital clinical reference intervals.`)
      }
    } catch (err) {
      console.error('Failed to initialize report modal:', err)
      setError('Failed to fetch request information.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (e) => {
    e.preventDefault()
    if (!summary.trim()) {
      setError('Please provide a clinical summary for the report.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const res = await labApi.generateReport({
        requestId: reportDetail.requestId,
        summary: summary.trim(),
        comments: comments.trim(),
        finalizeReport: finalizeNow
      })
      setReportDetail(res)
      setIsCreating(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to generate lab report:', err)
      setError(err.response?.data?.message || 'Failed to generate diagnostic report.')
    } finally {
      setSaving(false)
    }
  }

  const handleVerifyReport = async () => {
    if (!reportDetail?.id) return
    try {
      setSaving(true)
      setError(null)
      const res = await labApi.verifyReport(reportDetail.id)
      setReportDetail(res)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to verify report:', err)
      setError(err.response?.data?.message || 'Failed to verify report.')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '880px', width: '96%', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header (Screen Only) */}
        <div className="modal-header no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--secondary)' }}>
                {isCreating ? 'Generate Laboratory Diagnostic Report' : `Diagnostic Laboratory Report - ${reportDetail?.reportNumber || ''}`}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Certified diagnostic laboratory results, clinical findings & interpretive commentary
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!isCreating && reportDetail && (
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
              >
                <Printer size={15} /> Print
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-icon"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Report Document */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
          {error && (
            <div className="no-print" style={{
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Preparing diagnostic report...
            </div>
          ) : reportDetail ? (
            <div className="lab-report-sheet" style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '2rem'
            }}>
              {/* Official Hospital Laboratory Header */}
              <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '0.02em', margin: 0 }}>
                      CAREFLOW HOSPITAL & MEDICAL RESEARCH CENTER
                    </h1>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                      DEPARTMENT OF CLINICAL PATHOLOGY & LABORATORY MEDICINE
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      124 Healthcare Boulevard, Colombo 05, Sri Lanka | Phone: +94 11 234 5678 | lab@careflow.lk
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Diagnostic Report #
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--secondary)' }}>
                      {reportDetail.reportNumber || 'DRAFT / PREVIEW'}
                    </div>
                    {reportDetail.status && (
                      <div style={{ marginTop: '4px' }}>
                        <ReportStatusBadge status={reportDetail.status} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Patient & Order Demographics Box */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.85rem',
                fontSize: '0.82rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
                  <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.92rem' }}>
                    {reportDetail.patientName}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    ID: {reportDetail.patientNumber} | Age/Sex: {reportDetail.patientAge || 'N/A'} yrs / {reportDetail.patientGender}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Referring Doctor:</span>
                  <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                    {reportDetail.doctorName}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {reportDetail.doctorSpecialization || 'Clinical Services'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Order Details:</span>
                  <div>Req #: <strong>{reportDetail.requestNumber}</strong></div>
                  <div>
                    Priority: <PriorityBadge priority={reportDetail.priority || 'ROUTINE'} />
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Report Date / Time:</span>
                  <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                    {reportDetail.reportDate ? new Date(reportDetail.reportDate).toLocaleString() : new Date().toLocaleString()}
                  </div>
                  {reportDetail.samples?.[0] && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                      Barcode: {reportDetail.samples[0].sampleBarcode} ({reportDetail.samples[0].sampleType})
                    </div>
                  )}
                </div>
              </div>

              {/* Investigation Findings Table */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Laboratory Investigation Results
                </h3>

                {reportDetail.items?.map((item, itemIdx) => (
                  <div key={item.id || itemIdx} style={{ marginBottom: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{
                      backgroundColor: '#f1f5f9',
                      padding: '0.5rem 0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: 'var(--secondary)'
                    }}>
                      <span>{item.testName} ({item.testCode})</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Specimen: {item.sampleType} | Category: {item.category}
                      </span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#fbfcfd', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                          <th style={{ padding: '0.5rem 0.85rem', width: '35%' }}>TEST PARAMETER</th>
                          <th style={{ padding: '0.5rem 0.85rem', width: '20%' }}>OBSERVED VALUE</th>
                          <th style={{ padding: '0.5rem 0.85rem', width: '15%' }}>UNIT</th>
                          <th style={{ padding: '0.5rem 0.85rem', width: '20%' }}>REFERENCE INTERVAL</th>
                          <th style={{ padding: '0.5rem 0.85rem', width: '10%', textAlign: 'center' }}>FLAG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.results && item.results.length > 0 ? (
                          item.results.map((r, rIdx) => (
                            <tr key={r.id || rIdx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '0.5rem 0.85rem', fontWeight: 600 }}>
                                {r.parameterName}
                              </td>
                              <td style={{ padding: '0.5rem 0.85rem', fontWeight: 700, color: r.flag === 'CRITICAL' ? 'var(--danger)' : r.flag === 'HIGH' ? '#c2410c' : r.flag === 'LOW' ? 'var(--primary)' : 'inherit' }}>
                                {r.resultValue}
                              </td>
                              <td style={{ padding: '0.5rem 0.85rem', color: 'var(--text-muted)' }}>
                                {r.unit || '-'}
                              </td>
                              <td style={{ padding: '0.5rem 0.85rem', color: 'var(--text-muted)' }}>
                                {r.referenceRange || '-'}
                              </td>
                              <td style={{ padding: '0.5rem 0.85rem', textAlign: 'center' }}>
                                <ResultFlagBadge flag={r.flag} />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No individual parameters entered for this item.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              {/* Report Generation Form (If Creating) */}
              {isCreating ? (
                <div className="no-print" style={{ border: '1px solid #bfdbfe', borderRadius: '8px', padding: '1.25rem', backgroundColor: 'var(--primary-subtle)', marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-dark)', margin: '0 0 0.75rem 0' }}>
                    Author Clinical Findings & Summary
                  </h4>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Diagnostic Impression & Summary <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Comprehensive clinical pathology conclusion..."
                      required
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        fontSize: '0.85rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Additional Notes / Pathologist Recommendations
                    </label>
                    <textarea
                      rows={2}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="E.g., Correlate with fasting lipid profile in 8 weeks, repeat serum creatinine..."
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        fontSize: '0.85rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                      type="checkbox"
                      id="finalize-checkbox"
                      checked={finalizeNow}
                      onChange={(e) => setFinalizeNow(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="finalize-checkbox" style={{ fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: 'var(--secondary)' }}>
                      Mark as Finalized and Verified (Ready for clinical discharge / physician review)
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={handleGenerateReport}
                      disabled={saving}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <CheckCircle size={16} />
                      {saving ? 'Generating Report...' : 'Publish Official Report'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Report Summary & Verified Impression View */
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Clinical Diagnostic Summary:
                    </div>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
                      {reportDetail.summary || 'Findings verified within acceptable physiological limits.'}
                    </p>
                  </div>

                  {reportDetail.comments && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Clinical Recommendations & Notes:
                      </div>
                      <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                        {reportDetail.comments}
                      </p>
                    </div>
                  )}

                  {/* Signatures & Verification Block */}
                  <div style={{
                    marginTop: '2.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px dashed var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '1.5rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prepared / Reported By:</div>
                      <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                        {reportDetail.generatedByName || 'Medical Laboratory Scientist'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Licensed Medical Laboratory Technologist (MLT)
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified & Authorized By:</div>
                      <div style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <ShieldCheck size={16} />
                        {reportDetail.verifiedByName || (reportDetail.status === 'FINALIZED' ? 'Consultant Pathologist' : 'Pending Verification')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Consultant Clinical Pathologist / Laboratory Director
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer (Screen Only) */}
        <div className="modal-footer no-print" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {!isCreating && reportDetail?.status === 'PRELIMINARY' && (
              <button
                type="button"
                onClick={handleVerifyReport}
                disabled={saving}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--success)' }}
              >
                <ShieldCheck size={16} />
                {saving ? 'Verifying...' : 'Verify & Finalize Report'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>
            {!isCreating && reportDetail && (
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Printer size={16} />
                Print Official Report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
