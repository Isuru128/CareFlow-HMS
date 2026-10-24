import { useState } from 'react'
import { appointmentApi } from '../api/appointmentApi'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

export default function CancelAppointmentModal({ isOpen, onClose, onSuccess, appointment }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !appointment) return null

  const handleCancel = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide a reason for cancelling this appointment.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await appointmentApi.cancelAppointment(appointment.id, reason.trim())
      onSuccess(`Appointment ${appointment.appointmentNumber} has been cancelled.`)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '520px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--danger)' }}>
                Cancel Appointment
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {appointment.appointmentNumber} • {appointment.patientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-icon"
            style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCancel}>
          <div className="modal-body" style={{ padding: '1.25rem' }}>
            {error && (
              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid var(--danger-light)',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Are you sure you want to cancel the appointment for <strong>{appointment.patientName}</strong> with <strong>Dr. {appointment.doctorName}</strong> on <strong>{appointment.appointmentDate}</strong>?
            </p>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                Cancellation Reason <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State reason for patient or clinic cancellation..."
                className="form-control"
                rows={3}
                required
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Keep Appointment
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <span>Confirm Cancellation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
