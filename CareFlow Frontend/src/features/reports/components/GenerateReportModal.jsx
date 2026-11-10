import React, { useState, useEffect } from 'react'
import { reportApi } from '../api/reportApi'
import { X, FileBarChart, CheckCircle2, AlertCircle } from 'lucide-react'

const DEFAULT_TITLES = {
  PATIENT_REPORT: 'Patient Demographics, Admissions & Registration Analytics Report',
  APPOINTMENT_REPORT: 'Outpatient Clinic Appointment Volume & Specialist Utilization Report',
  REVENUE_REPORT: 'Hospital Financial Revenue, Collections & Charge Category Breakdown Report',
  PHARMACY_REPORT: 'Pharmacy Formulary Valuation, FEFO Expiry & Dispensing Audit Report',
  LABORATORY_REPORT: 'Diagnostic Laboratory Turnaround & Abnormal Result Flag Report',
  STAFF_REPORT: 'Human Resources Workforce, Shift Attendance & Leave Utilization Report'
}

export default function GenerateReportModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedCategory = 'REVENUE_REPORT'
}) {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    reportCategory: 'REVENUE_REPORT',
    reportTitle: DEFAULT_TITLES.REVENUE_REPORT,
    periodStart: thirtyDaysAgo,
    periodEnd: today,
    departmentName: 'All Hospital Departments',
    executiveSummary: '',
    keyFindings: '',
    recommendations: '',
    status: 'FINALIZED'
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      const cat = preselectedCategory || 'REVENUE_REPORT'
      setError(null)
      setFormData({
        reportCategory: cat,
        reportTitle: DEFAULT_TITLES[cat] || 'Hospital Analytical Report',
        periodStart: thirtyDaysAgo,
        periodEnd: today,
        departmentName: 'All Hospital Departments',
        executiveSummary: '',
        keyFindings: '',
        recommendations: '',
        status: 'FINALIZED'
      })
    }
  }, [isOpen, preselectedCategory, today, thirtyDaysAgo])

  if (!isOpen) return null

  const handleCategoryChange = (e) => {
    const cat = e.target.value
    setFormData(prev => ({
      ...prev,
      reportCategory: cat,
      reportTitle: DEFAULT_TITLES[cat] || prev.reportTitle
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.reportTitle.trim()) {
      setError('Please enter a report title.')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await reportApi.generateAndSaveReport(formData)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate and save report snapshot.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileBarChart size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                Generate & Save Analytical Report Snapshot
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Automatically aggregates live metrics from CareFlow HMS and archives a formal report
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Module 3.10 Report Category *</label>
                <select
                  className="form-select"
                  value={formData.reportCategory}
                  onChange={handleCategoryChange}
                >
                  <option value="PATIENT_REPORT">1. Patient Report</option>
                  <option value="APPOINTMENT_REPORT">2. Appointment Report</option>
                  <option value="REVENUE_REPORT">3. Revenue & Financial Report</option>
                  <option value="PHARMACY_REPORT">4. Pharmacy Inventory Report</option>
                  <option value="LABORATORY_REPORT">5. Laboratory Diagnostic Report</option>
                  <option value="STAFF_REPORT">6. Staff & HR Report</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Department / Division Scope</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="All Hospital Departments"
                  value={formData.departmentName}
                  onChange={(e) => setFormData(prev => ({ ...prev, departmentName: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Report Title *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.reportTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, reportTitle: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Period Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.periodStart}
                  onChange={(e) => setFormData(prev => ({ ...prev, periodStart: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Period End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.periodEnd}
                  onChange={(e) => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Publication Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="FINALIZED">Finalized</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Executive Summary (Leave blank to auto-generate from live database metrics)</label>
              <textarea
                rows={2}
                className="form-input"
                placeholder="Auto-populated with live database counts and totals if left empty..."
                value={formData.executiveSummary}
                onChange={(e) => setFormData(prev => ({ ...prev, executiveSummary: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Key Analytical Findings (Optional override)</label>
              <textarea
                rows={2}
                className="form-input"
                placeholder="Auto-populated with live category KPIs if left empty..."
                value={formData.keyFindings}
                onChange={(e) => setFormData(prev => ({ ...prev, keyFindings: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Administrative / Clinical Recommendations (Optional override)</label>
              <textarea
                rows={2}
                className="form-input"
                placeholder="Strategic action items or operational recommendations..."
                value={formData.recommendations}
                onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Generating Snapshot...' : 'Generate & Save Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

