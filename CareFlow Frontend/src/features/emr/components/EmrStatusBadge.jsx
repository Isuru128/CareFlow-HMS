export default function EmrStatusBadge({ status, type = 'status' }) {
  const configs = {
    // Record / Report Status
    FINALIZED: { label: 'Finalized', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    DRAFT: { label: 'Draft', bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
    ARCHIVED: { label: 'Archived', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },

    // Diagnosis Status
    ACTIVE: { label: 'Active', bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
    CHRONIC: { label: 'Chronic', bg: '#ede9fe', color: '#7c3aed', border: '#ddd6fe' },
    RESOLVED: { label: 'Resolved', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    IN_REMISSION: { label: 'In Remission', bg: '#e0f2fe', color: '#0284c7', border: '#bae6fd' },

    // Prescription Status
    DISPENSED: { label: 'Dispensed', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    PARTIALLY_DISPENSED: { label: 'Partially Dispensed', bg: '#ffedd5', color: '#ea580c', border: '#fed7aa' },
    CANCELLED: { label: 'Cancelled', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
    EXPIRED: { label: 'Expired', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },

    // Treatment Status
    PLANNED: { label: 'Planned', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
    IN_PROGRESS: { label: 'In Progress', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
    COMPLETED: { label: 'Completed', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
    DISCONTINUED: { label: 'Discontinued', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },

    // Treatment Outcome
    RECOVERED: { label: 'Recovered', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    IMPROVED: { label: 'Improved', bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
    UNCHANGED: { label: 'Unchanged', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
    DETERIORATED: { label: 'Deteriorated', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    NOT_EVALUATED: { label: 'Pending Evaluation', bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' },

    // Severity
    MILD: { label: 'Mild', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    MODERATE: { label: 'Moderate', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    SEVERE: { label: 'Severe', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },

    // Diagnosis Type
    PRIMARY: { label: 'Primary', bg: '#e0f2fe', color: '#0284c7', border: '#bae6fd' },
    SECONDARY: { label: 'Secondary', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
    PROVISIONAL: { label: 'Provisional', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
    DIFFERENTIAL: { label: 'Differential', bg: '#f5f3ff', color: '#6d28d9', border: '#ede9fe' },
    FINAL: { label: 'Final', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' }
  }

  const current = configs[status] || {
    label: status ? String(status).replace(/_/g, ' ') : 'N/A',
    bg: '#f1f5f9',
    color: '#64748b',
    border: '#cbd5e1'
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.2
      }}
    >
      {current.label}
    </span>
  )
}
