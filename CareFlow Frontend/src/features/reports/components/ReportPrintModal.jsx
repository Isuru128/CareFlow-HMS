import React from 'react'
import { ReportCategoryBadge, ReportStatusBadge } from './ReportCategoryBadge'
import { X, Printer, HeartPulse, CheckCircle2 } from 'lucide-react'

export default function ReportPrintModal({ isOpen, onClose, report }) {
  if (!isOpen || !report) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '760px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontWeight: 800, color: '#0284c7' }}>{report.reportNumber}</span>
            <ReportCategoryBadge category={report.reportCategory} />
            <ReportStatusBadge status={report.status} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-primary btn-sm"
            >
              <Printer size={14} />
              <span>Print Report</span>
            </button>
            <button type="button" className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '1.75rem' }}>
          {/* Formal Hospital Letterhead */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingBottom: '1.25rem',
            marginBottom: '1.25rem',
            borderBottom: '2px solid #0284c7'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HeartPulse size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  CAREFLOW HOSPITAL MANAGEMENT SYSTEM
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                  Executive Management Information & Clinical Analytics Division • Colombo, Sri Lanka
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.95rem' }}>
                {report.reportNumber}
              </div>
              <div style={{ color: '#64748b' }}>
                Generated: {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>

          {/* Report Title & Metadata Box */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
              {report.reportTitle}
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.75rem',
              padding: '0.9rem 1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '0.8rem'
            }}>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>Reporting Period</div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {report.periodStart || 'Inception'} → {report.periodEnd || 'Current'}
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>Department Scope</div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {report.departmentName || 'All Departments'}
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>Records Analyzed</div>
                <div style={{ fontWeight: 800, color: '#0284c7' }}>
                  {report.totalRecordsAnalyzed || 0} Records
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>{report.primaryMetricLabel || 'Primary KPI'}</div>
                <div style={{ fontWeight: 800, color: '#059669' }}>
                  {report.primaryMetricValue || 'Verified'}
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div style={{ marginBottom: '1.15rem' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#0284c7', marginBottom: '0.4rem' }}>
              1. Executive Summary
            </h4>
            <div style={{
              padding: '0.9rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              fontSize: '0.86rem',
              lineHeight: 1.6,
              color: '#1e293b',
              whiteSpace: 'pre-line'
            }}>
              {report.executiveSummary}
            </div>
          </div>

          {/* Key Analytical Findings */}
          {report.keyFindings && (
            <div style={{ marginBottom: '1.15rem' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#059669', marginBottom: '0.4rem' }}>
                2. Key Analytical Findings & Metrics
              </h4>
              <div style={{
                padding: '0.9rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                color: '#14532d',
                whiteSpace: 'pre-line'
              }}>
                {report.keyFindings}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#6d28d9', marginBottom: '0.4rem' }}>
                3. Operational & Clinical Recommendations
              </h4>
              <div style={{
                padding: '0.9rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#f5f3ff',
                border: '1px solid #ddd6fe',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                color: '#3b0764',
                whiteSpace: 'pre-line'
              }}>
                {report.recommendations}
              </div>
            </div>
          )}

          {/* Footer Verification Block */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px dashed #cbd5e1',
            fontSize: '0.78rem',
            color: '#64748b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#059669" />
              <span>Compiled by: <strong>{report.generatedByName || 'CareFlow Analytics Engine'}</strong></span>
            </div>
            <div>
              Official CareFlow HMS Analytical Document • Confidential
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </div>
  )
}

