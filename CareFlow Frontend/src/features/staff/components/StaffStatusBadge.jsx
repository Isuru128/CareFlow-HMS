import React from 'react'

export function StaffStatusBadge({ status }) {
  const styles = {
    ACTIVE: { bg: '#dcfce7', color: '#15803d', border: '#86efac', label: 'Active' },
    ON_LEAVE: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d', label: 'On Leave' },
    SUSPENDED: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', label: 'Suspended' },
    RESIGNED: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Resigned' },
    TERMINATED: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', label: 'Terminated' }
  }
  const s = styles[status] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: status || 'Unknown' }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.6rem',
      borderRadius: '999px',
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

export function RoleCategoryBadge({ roleCategory }) {
  const styles = {
    NURSE: { bg: '#e0f2fe', color: '#0369a1', label: 'Nursing Staff' },
    LABORATORY_STAFF: { bg: '#ede9fe', color: '#6d28d9', label: 'Laboratory Staff' },
    PHARMACIST: { bg: '#ecfdf5', color: '#047857', label: 'Pharmacist' },
    RECEPTIONIST: { bg: '#fef3c7', color: '#b45309', label: 'Receptionist' },
    ACCOUNTANT: { bg: '#fce7f3', color: '#be185d', label: 'Accountant' },
    DOCTOR: { bg: '#dbeafe', color: '#1d4ed8', label: 'Medical Officer' },
    ADMINISTRATIVE: { bg: '#f1f5f9', color: '#334155', label: 'Administration' },
    SUPPORT_STAFF: { bg: '#ffedd5', color: '#c2410c', label: 'Support Staff' }
  }
  const s = styles[roleCategory] || { bg: '#f1f5f9', color: '#475569', label: roleCategory || 'Staff' }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.18rem 0.55rem',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 700,
      backgroundColor: s.bg,
      color: s.color,
      whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  )
}

export function ShiftTypeBadge({ shiftType }) {
  const styles = {
    MORNING: { bg: '#fef9c3', color: '#854d0e', label: 'Morning (07:30 - 15:30)' },
    REGULAR_DAY: { bg: '#e0f2fe', color: '#075985', label: 'Regular Day (08:00 - 17:00)' },
    EVENING: { bg: '#ffedd5', color: '#9a3412', label: 'Evening (14:00 - 22:00)' },
    NIGHT: { bg: '#e0e7ff', color: '#3730a3', label: 'Night (21:30 - 07:30)' },
    ROTATIONAL: { bg: '#f3e8ff', color: '#6b21a8', label: 'Rotational Shift' }
  }
  const s = styles[shiftType] || { bg: '#f1f5f9', color: '#475569', label: shiftType || 'Standard' }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.18rem 0.55rem',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 600,
      backgroundColor: s.bg,
      color: s.color,
      whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  )
}

export function EmploymentTypeBadge({ employmentType }) {
  const labels = {
    FULL_TIME: 'Full-Time',
    PART_TIME: 'Part-Time',
    CONTRACT: 'Contract',
    VISITING: 'Visiting',
    INTERN: 'Intern / Trainee'
  }
  return (
    <span style={{
      display: 'inline-flex',
      padding: '0.15rem 0.5rem',
      borderRadius: '5px',
      fontSize: '0.71rem',
      fontWeight: 600,
      backgroundColor: '#f8fafc',
      color: '#475569',
      border: '1px solid #e2e8f0',
      whiteSpace: 'nowrap'
    }}>
      {labels[employmentType] || employmentType}
    </span>
  )
}

export function AttendanceStatusBadge({ status }) {
  const styles = {
    PRESENT: { bg: '#dcfce7', color: '#15803d', border: '#86efac', label: 'Present' },
    LATE: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d', label: 'Late Arrival' },
    HALF_DAY: { bg: '#ffedd5', color: '#c2410c', border: '#fdba74', label: 'Half Day' },
    ABSENT: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', label: 'Absent' },
    ON_LEAVE: { bg: '#e0e7ff', color: '#4338ca', border: '#a5b4fc', label: 'On Leave' },
    HOLIDAY: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Off / Holiday' }
  }
  const s = styles[status] || { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', label: status || 'Not Marked' }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.6rem',
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

export function AssignmentTypeBadge({ type }) {
  const styles = {
    INITIAL_ASSIGNMENT: { bg: '#e0f2fe', color: '#0369a1', label: 'Initial Placement' },
    TRANSFER: { bg: '#fef3c7', color: '#b45309', label: 'Dept Transfer' },
    PROMOTION: { bg: '#dcfce7', color: '#15803d', label: 'Promotion' },
    TEMPORARY_ROTATION: { bg: '#ede9fe', color: '#6d28d9', label: 'Rotation' },
    REASSIGNMENT: { bg: '#f1f5f9', color: '#334155', label: 'Reassignment' }
  }
  const s = styles[type] || { bg: '#f1f5f9', color: '#475569', label: type }

  return (
    <span style={{
      display: 'inline-flex',
      padding: '0.2rem 0.55rem',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 700,
      backgroundColor: s.bg,
      color: s.color,
      whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  )
}

export function LeaveTypeBadge({ leaveType }) {
  const styles = {
    ANNUAL: { bg: '#e0f2fe', color: '#0284c7', label: 'Annual Leave' },
    CASUAL: { bg: '#ecfdf5', color: '#059669', label: 'Casual Leave' },
    SICK: { bg: '#fee2e2', color: '#dc2626', label: 'Medical / Sick Leave' },
    MATERNITY: { bg: '#fce7f3', color: '#db2777', label: 'Maternity Leave' },
    PATERNITY: { bg: '#ede9fe', color: '#7c3aed', label: 'Paternity Leave' },
    STUDY: { bg: '#fef3c7', color: '#d97706', label: 'Study / CPD Leave' },
    EMERGENCY: { bg: '#ffedd5', color: '#ea580c', label: 'Emergency Leave' },
    UNPAID: { bg: '#f1f5f9', color: '#475569', label: 'No-Pay / Unpaid' }
  }
  const s = styles[leaveType] || { bg: '#f1f5f9', color: '#475569', label: leaveType }

  return (
    <span style={{
      display: 'inline-flex',
      padding: '0.18rem 0.55rem',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 700,
      backgroundColor: s.bg,
      color: s.color,
      whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  )
}

export function LeaveStatusBadge({ status }) {
  const styles = {
    PENDING: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d', label: 'Pending Review' },
    APPROVED: { bg: '#dcfce7', color: '#15803d', border: '#86efac', label: 'Approved' },
    REJECTED: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', label: 'Rejected' },
    CANCELLED: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Cancelled' }
  }
  const s = styles[status] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: status }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.6rem',
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

