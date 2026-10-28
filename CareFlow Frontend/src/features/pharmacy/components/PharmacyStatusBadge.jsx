import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, XCircle, ShieldCheck } from 'lucide-react'

export function CategoryBadge({ category }) {
  const categoryConfig = {
    ANALGESIC: { label: 'Analgesic', bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171', border: 'rgba(239, 68, 68, 0.25)' },
    ANTIBIOTIC: { label: 'Antibiotic', bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' },
    ANTIHYPERTENSIVE: { label: 'Antihypertensive', bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' },
    ANTIDIABETIC: { label: 'Antidiabetic', bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
    ANTIHISTAMINE: { label: 'Antihistamine', bg: 'rgba(168, 85, 247, 0.12)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.25)' },
    ANTIPYRETIC: { label: 'Antipyretic', bg: 'rgba(244, 63, 94, 0.12)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.25)' },
    GASTROINTESTINAL: { label: 'Gastrointestinal', bg: 'rgba(20, 184, 166, 0.12)', text: '#2dd4bf', border: 'rgba(20, 184, 166, 0.25)' },
    CARDIOVASCULAR: { label: 'Cardiovascular', bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.25)' },
    RESPIRATORY: { label: 'Respiratory', bg: 'rgba(14, 165, 233, 0.12)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.25)' },
    DERMATOLOGICAL: { label: 'Dermatological', bg: 'rgba(236, 72, 153, 0.12)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.25)' },
    VITAMINS_SUPPLEMENTS: { label: 'Vitamins & Supp.', bg: 'rgba(132, 204, 22, 0.12)', text: '#a3e635', border: 'rgba(132, 204, 22, 0.25)' },
    OTHER: { label: 'Other', bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.25)' }
  }

  const config = categoryConfig[category] || categoryConfig.OTHER

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.55rem',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.02em',
      backgroundColor: config.bg,
      color: config.text,
      border: `1px solid ${config.border}`
    }}>
      {config.label}
    </span>
  )
}

export function DosageFormBadge({ form }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.18rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.7rem',
      fontWeight: 500,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      color: 'var(--text-muted, #94a3b8)',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      {form ? form.replace('_', ' ') : 'N/A'}
    </span>
  )
}

export function StockLevelBadge({ totalStock, reorderLevel }) {
  let bg = 'rgba(16, 185, 129, 0.12)'
  let text = '#34d399'
  let border = 'rgba(16, 185, 129, 0.25)'
  let label = `${totalStock} in stock`
  let Icon = CheckCircle2

  if (totalStock === 0) {
    bg = 'rgba(239, 68, 68, 0.15)'
    text = '#f87171'
    border = 'rgba(239, 68, 68, 0.3)'
    label = 'Out of Stock'
    Icon = XCircle
  } else if (totalStock <= reorderLevel) {
    bg = 'rgba(245, 158, 11, 0.15)'
    text = '#fbbf24'
    border = 'rgba(245, 158, 11, 0.3)'
    label = `Low Stock (${totalStock})`
    Icon = AlertTriangle
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.22rem 0.6rem',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: bg,
      color: text,
      border: `1px solid ${border}`
    }}>
      <Icon size={13} />
      {label}
    </span>
  )
}

export function BatchStatusBadge({ status }) {
  const statusMap = {
    ACTIVE: { label: 'Active', bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: 'rgba(16, 185, 129, 0.25)', icon: CheckCircle2 },
    EXPIRED: { label: 'Expired', bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)', icon: AlertCircle },
    DEPLETED: { label: 'Depleted', bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.25)', icon: XCircle },
    RECALLED: { label: 'Recalled', bg: 'rgba(217, 70, 239, 0.15)', text: '#e879f9', border: 'rgba(217, 70, 239, 0.3)', icon: AlertTriangle }
  }

  const s = statusMap[status] || statusMap.ACTIVE
  const Icon = s.icon

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.2rem 0.55rem',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 600,
      backgroundColor: s.bg,
      color: s.text,
      border: `1px solid ${s.border}`
    }}>
      <Icon size={12} />
      {s.label}
    </span>
  )
}

export function ExpiryBadge({ expiryDate, daysUntilExpiry, isExpired }) {
  if (isExpired || daysUntilExpiry <= 0) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: 600,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.3)'
      }}>
        <AlertCircle size={12} />
        Expired ({expiryDate})
      </span>
    )
  }

  if (daysUntilExpiry <= 30) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: 600,
        backgroundColor: 'rgba(244, 63, 94, 0.15)',
        color: '#fb7185',
        border: '1px solid rgba(244, 63, 94, 0.3)'
      }}>
        <AlertTriangle size={12} />
        {daysUntilExpiry} days left ({expiryDate})
      </span>
    )
  }

  if (daysUntilExpiry <= 60) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: 600,
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        color: '#fbbf24',
        border: '1px solid rgba(245, 158, 11, 0.25)'
      }}>
        <Clock size={12} />
        {daysUntilExpiry} days left ({expiryDate})
      </span>
    )
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.2rem 0.55rem',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 500,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      color: '#34d399',
      border: '1px solid rgba(16, 185, 129, 0.2)'
    }}>
      <CheckCircle2 size={12} />
      {expiryDate}
    </span>
  )
}

export function PaymentStatusBadge({ status }) {
  const map = {
    PAID: { label: 'Paid', bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
    PENDING: { label: 'Pending', bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' },
    WAIVED: { label: 'Waived', bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' }
  }
  const s = map[status] || map.PAID
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.55rem',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 600,
      backgroundColor: s.bg,
      color: s.text,
      border: `1px solid ${s.border}`
    }}>
      {s.label}
    </span>
  )
}

export function DispensationStatusBadge({ status }) {
  const map = {
    COMPLETED: { label: 'Fulfilled', bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
    CANCELLED: { label: 'Cancelled', bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
    REFUNDED: { label: 'Refunded', bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' }
  }
  const s = map[status] || map.COMPLETED
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.55rem',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 600,
      backgroundColor: s.bg,
      color: s.text,
      border: `1px solid ${s.border}`
    }}>
      {s.label}
    </span>
  )
}
