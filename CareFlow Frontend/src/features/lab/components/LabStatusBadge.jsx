export function PriorityBadge({ priority }) {
  const configs = {
    STAT: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', label: 'STAT (Immediate)', dot: '#ef4444' },
    URGENT: { bg: '#ffedd5', color: '#c2410c', border: '#fdba74', label: 'Urgent', dot: '#f97316' },
    ROUTINE: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Routine', dot: '#94a3b8' }
  }

  const conf = configs[priority] || configs.ROUTINE

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 8px',
      borderRadius: '9999px',
      fontSize: '0.72rem',
      fontWeight: 600,
      backgroundColor: conf.bg,
      color: conf.color,
      border: `1px solid ${conf.border}`,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap'
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: conf.dot,
        animation: priority === 'STAT' ? 'pulse 1.5s infinite' : 'none'
      }} />
      {conf.label}
    </span>
  )
}

export function RequestStatusBadge({ status }) {
  const configs = {
    REQUESTED: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Requested' },
    SAMPLE_COLLECTED: { bg: '#fdf4ff', color: '#a21caf', border: '#f5d0fe', label: 'Sample Collected' },
    IN_PROGRESS: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'In Progress' },
    COMPLETED: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Completed' },
    CANCELLED: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: 'Cancelled' }
  }

  const conf = configs[status] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: status || 'Unknown' }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 9px',
      borderRadius: '6px',
      fontSize: '0.74rem',
      fontWeight: 600,
      backgroundColor: conf.bg,
      color: conf.color,
      border: `1px solid ${conf.border}`,
      whiteSpace: 'nowrap'
    }}>
      {conf.label}
    </span>
  )
}

export function SampleStatusBadge({ status }) {
  const configs = {
    COLLECTED: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'Collected' },
    RECEIVED_IN_LAB: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Received in Lab' },
    PROCESSING: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Processing' },
    REJECTED: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: 'Rejected' },
    DISPOSED: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', label: 'Disposed' }
  }

  const conf = configs[status] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: status || 'Unknown' }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.72rem',
      fontWeight: 600,
      backgroundColor: conf.bg,
      color: conf.color,
      border: `1px solid ${conf.border}`
    }}>
      {conf.label}
    </span>
  )
}

export function ResultFlagBadge({ flag }) {
  const configs = {
    NORMAL: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'NORMAL' },
    LOW: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'LOW' },
    HIGH: { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5', label: 'HIGH' },
    CRITICAL: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: 'CRITICAL' },
    ABNORMAL: { bg: '#faf5ff', color: '#7e22ce', border: '#f3e8ff', label: 'ABNORMAL' }
  }

  const conf = configs[flag] || configs.NORMAL

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 7px',
      borderRadius: '4px',
      fontSize: '0.68rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      backgroundColor: conf.bg,
      color: conf.color,
      border: `1px solid ${conf.border}`
    }}>
      {conf.label}
    </span>
  )
}

export function ReportStatusBadge({ status }) {
  const configs = {
    PRELIMINARY: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Preliminary' },
    FINALIZED: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Finalized / Verified' },
    AMENDED: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', label: 'Amended' }
  }

  const conf = configs[status] || configs.PRELIMINARY

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 9px',
      borderRadius: '6px',
      fontSize: '0.74rem',
      fontWeight: 600,
      backgroundColor: conf.bg,
      color: conf.color,
      border: `1px solid ${conf.border}`
    }}>
      {conf.label}
    </span>
  )
}
