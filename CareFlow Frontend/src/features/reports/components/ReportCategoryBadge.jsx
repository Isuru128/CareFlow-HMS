import React from 'react'

export function ReportCategoryBadge({ category }) {
  const styles = {
    PATIENT_REPORT: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: 'Patient Report' },
    APPOINTMENT_REPORT: { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe', label: 'Appointment Report' },
    REVENUE_REPORT: { bg: '#dcfce7', color: '#15803d', border: '#86efac', label: 'Revenue Report' },
    PHARMACY_REPORT: { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'Pharmacy Report' },
    LABORATORY_REPORT: { bg: '#fce7f3', color: '#be185d', border: '#fbcfe8', label: 'Laboratory Report' },
    STAFF_REPORT: { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe', label: 'Staff Report' }
  }
  const s = styles[category] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: category || 'Report' }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.6rem',
      borderRadius: '6px',
      fontSize: '0.73rem',
      fontWeight: 700,
      backgroundColor: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  )
}

export function ReportStatusBadge({ status }) {
  const styles = {
    FINALIZED: { bg: '#dcfce7', color: '#15803d', border: '#86efac', label: 'Finalized' },
    DRAFT: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d', label: 'Draft' },
    ARCHIVED: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Archived' }
  }
  const s = styles[status] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: status }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.18rem 0.58rem',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontWeight: 700,
      backgroundColor: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  )
}

export function MetricProgressBar({
  label,
  count,
  amount,
  percentage = 0,
  secondaryInfo,
  color = '#0284c7',
  showCurrency = false
}) {
  const clampedPct = Math.min(100, Math.max(0, Number(percentage) || 0))

  return (
    <div style={{
      padding: '0.7rem 0.85rem',
      borderRadius: '8px',
      backgroundColor: '#f8fafc',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.38rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-main)' }}>
            {label}
          </span>
          {secondaryInfo && (
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginLeft: '0.45rem' }}>
              ({secondaryInfo})
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '0.84rem' }}>
          {showCurrency ? (
            <span style={{ color }}>
              LKR {Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          ) : (
            <span style={{ color: 'var(--text-main)' }}>
              {count}
            </span>
          )}
          <span style={{
            fontSize: '0.72rem',
            padding: '0.1rem 0.45rem',
            borderRadius: '999px',
            backgroundColor: '#e2e8f0',
            color: '#334155',
            fontWeight: 700
          }}>
            {clampedPct}%
          </span>
        </div>
      </div>

      <div style={{
        width: '100%',
        height: '7px',
        backgroundColor: '#e2e8f0',
        borderRadius: '999px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${clampedPct}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '999px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  )
}

