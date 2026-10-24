export default function AppointmentStatusBadge({ status }) {
  const configs = {
    SCHEDULED: {
      label: 'Scheduled',
      bg: '#e0f2fe',
      color: '#0284c7',
      border: '#bae6fd'
    },
    CONFIRMED: {
      label: 'Confirmed',
      bg: '#ede9fe',
      color: '#7c3aed',
      border: '#ddd6fe'
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bg: '#fef3c7',
      color: '#d97706',
      border: '#fde68a'
    },
    COMPLETED: {
      label: 'Completed',
      bg: '#ecfdf5',
      color: '#059669',
      border: '#a7f3d0'
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: '#fef2f2',
      color: '#dc2626',
      border: '#fecaca'
    },
    NO_SHOW: {
      label: 'No Show',
      bg: '#f1f5f9',
      color: '#64748b',
      border: '#cbd5e1'
    },
    RESCHEDULED: {
      label: 'Rescheduled',
      bg: '#ffedd5',
      color: '#ea580c',
      border: '#fed7aa'
    }
  }

  const current = configs[status] || {
    label: status || 'Unknown',
    bg: '#f1f5f9',
    color: '#64748b',
    border: '#cbd5e1'
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap'
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: current.color,
          marginRight: '0.35rem'
        }}
      />
      {current.label}
    </span>
  )
}
