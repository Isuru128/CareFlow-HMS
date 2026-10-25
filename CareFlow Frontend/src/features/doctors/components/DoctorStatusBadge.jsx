export default function DoctorStatusBadge({ status }) {
  const configs = {
    ACTIVE: {
      label: 'Active',
      bg: '#ecfdf5',
      color: '#059669',
      border: '#a7f3d0'
    },
    ON_LEAVE: {
      label: 'On Leave',
      bg: '#fffbeb',
      color: '#d97706',
      border: '#fde68a'
    },
    INACTIVE: {
      label: 'Inactive',
      bg: '#f1f5f9',
      color: '#64748b',
      border: '#cbd5e1'
    },
    RETIRED: {
      label: 'Retired',
      bg: '#fef2f2',
      color: '#dc2626',
      border: '#fecaca'
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
        letterSpacing: '0.02em'
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
