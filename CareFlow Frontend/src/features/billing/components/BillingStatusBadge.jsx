import React from 'react'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Stethoscope,
  FlaskConical,
  Pill,
  BedDouble,
  Activity,
  CreditCard,
  Banknote,
  Building2,
  ShieldCheck,
  Globe,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react'

export function InvoiceStatusBadge({ status }) {
  const map = {
    DRAFT: {
      label: 'Draft',
      bg: '#f1f5f9',
      text: '#475569',
      border: '#cbd5e1',
      icon: FileText
    },
    ISSUED: {
      label: 'Issued (Unpaid)',
      bg: '#eff6ff',
      text: '#1d4ed8',
      border: '#bfdbfe',
      icon: Clock
    },
    PARTIALLY_PAID: {
      label: 'Partially Paid',
      bg: '#fef3c7',
      text: '#b45309',
      border: '#fde68a',
      icon: Clock
    },
    PAID: {
      label: 'Paid in Full',
      bg: '#ecfdf5',
      text: '#047857',
      border: '#a7f3d0',
      icon: CheckCircle2
    },
    OVERDUE: {
      label: 'Overdue',
      bg: '#fef2f2',
      text: '#b91c1c',
      border: '#fecaca',
      icon: AlertCircle
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: '#f8fafc',
      text: '#64748b',
      border: '#e2e8f0',
      icon: XCircle
    },
    REFUNDED: {
      label: 'Refunded',
      bg: '#fdf4ff',
      text: '#86198f',
      border: '#f5d0fe',
      icon: RotateCcw
    }
  }

  const s = map[status] || map.ISSUED
  const Icon = s.icon

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.22rem 0.65rem',
      borderRadius: '9999px',
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.02em',
      backgroundColor: s.bg,
      color: s.text,
      border: `1px solid ${s.border}`
    }}>
      <Icon size={12} />
      <span>{s.label}</span>
    </span>
  )
}

export function ChargeTypeBadge({ chargeType }) {
  const map = {
    CONSULTATION: {
      label: 'Consultation',
      bg: '#e0f2fe',
      text: '#0369a1',
      border: '#bae6fd',
      icon: Stethoscope
    },
    LABORATORY: {
      label: 'Laboratory',
      bg: '#ede9fe',
      text: '#6d28d9',
      border: '#ddd6fe',
      icon: FlaskConical
    },
    PHARMACY: {
      label: 'Pharmacy',
      bg: '#ccfbf1',
      text: '#0f766e',
      border: '#99f6e4',
      icon: Pill
    },
    ADMISSION: {
      label: 'Admission / Ward',
      bg: '#fef3c7',
      text: '#b45309',
      border: '#fde68a',
      icon: BedDouble
    },
    PROCEDURE: {
      label: 'Procedure',
      bg: '#fce7f3',
      text: '#be185d',
      border: '#fbcfe8',
      icon: Activity
    },
    OTHER: {
      label: 'Other Charge',
      bg: '#f1f5f9',
      text: '#475569',
      border: '#cbd5e1',
      icon: FileText
    }
  }

  const c = map[chargeType] || map.OTHER
  const Icon = c.icon

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.2rem 0.55rem',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 600,
      backgroundColor: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`
    }}>
      <Icon size={12} />
      <span>{c.label}</span>
    </span>
  )
}

export function PaymentMethodBadge({ method }) {
  const map = {
    CASH: { label: 'Cash', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', icon: Banknote },
    CARD: { label: 'Credit / Debit Card', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', icon: CreditCard },
    BANK_TRANSFER: { label: 'Bank Transfer', bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd', icon: Building2 },
    INSURANCE: { label: 'Insurance Claim', bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe', icon: ShieldCheck },
    ONLINE: { label: 'Online Gateway', bg: '#fdf4ff', text: '#86198f', border: '#f5d0fe', icon: Globe },
    CHEQUE: { label: 'Bank Cheque', bg: '#fef3c7', text: '#b45309', border: '#fde68a', icon: FileSpreadsheet }
  }

  const m = map[method] || map.CASH
  const Icon = m.icon

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.2rem 0.55rem',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 600,
      backgroundColor: m.bg,
      color: m.text,
      border: `1px solid ${m.border}`
    }}>
      <Icon size={12} />
      <span>{m.label}</span>
    </span>
  )
}

export function PaymentRecordStatusBadge({ status }) {
  const map = {
    COMPLETED: { label: 'Completed', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    PENDING: { label: 'Pending', bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
    FAILED: { label: 'Failed', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
    REFUNDED: { label: 'Refunded', bg: '#fdf4ff', text: '#86198f', border: '#f5d0fe' }
  }

  const s = map[status] || map.COMPLETED
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.18rem 0.55rem',
      borderRadius: '9999px',
      fontSize: '0.7rem',
      fontWeight: 700,
      backgroundColor: s.bg,
      color: s.text,
      border: `1px solid ${s.border}`
    }}>
      {s.label}
    </span>
  )
}

export function AdmissionStatusBadge({ status }) {
  const map = {
    ADMITTED: { label: 'Admitted (Active)', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    DISCHARGED: { label: 'Discharged', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    TRANSFERRED: { label: 'Transferred', bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
    CANCELLED: { label: 'Cancelled', bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' }
  }

  const s = map[status] || map.ADMITTED
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.72rem',
      fontWeight: 700,
      backgroundColor: s.bg,
      color: s.text,
      border: `1px solid ${s.border}`
    }}>
      {s.label}
    </span>
  )
}

export function RoomTypeBadge({ roomType }) {
  const labels = {
    GENERAL_WARD: 'General Ward',
    SEMI_PRIVATE: 'Semi-Private Room',
    PRIVATE_ROOM: 'Private Room',
    DELUXE_SUITE: 'Deluxe Suite',
    ICU: 'Intensive Care (ICU)',
    NICU: 'Neonatal ICU',
    EMERGENCY_OBSERVATION: 'Emergency Obs.'
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.18rem 0.5rem',
      borderRadius: '5px',
      fontSize: '0.71rem',
      fontWeight: 600,
      backgroundColor: '#f8fafc',
      color: '#334155',
      border: '1px solid #cbd5e1'
    }}>
      <BedDouble size={11} />
      <span>{labels[roomType] || roomType}</span>
    </span>
  )
}

