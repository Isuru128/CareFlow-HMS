import { useState } from 'react'
import { appointmentApi } from '../api/appointmentApi'
import { X, Calendar, Clock, User, Stethoscope, DollarSign, FileText, CheckCircle2, Play, AlertCircle, RefreshCw, XCircle, ArrowRight } from 'lucide-react'
import AppointmentStatusBadge from './AppointmentStatusBadge'

export default function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  onStatusUpdated,
  onOpenReschedule,
  onOpenCancel
}) {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !appointment) return null

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true)
    setError('')
    try {
      await appointmentApi.updateAppointmentStatus(appointment.id, newStatus)
      if (onStatusUpdated) onStatusUpdated(`Status updated to ${newStatus}`)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment status.')
    } finally {
      setUpdating(false)
    }
  }

  const isFinal = appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '680px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Appointment #{appointment.appointmentNumber}
                </h3>
                <AppointmentStatusBadge status={appointment.status} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Queue Token: <strong>#{appointment.queueNumber}</strong> • Type: {appointment.appointmentType}
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

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.25rem' }}>
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

          {/* Patient & Doctor Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Patient card */}
            <div style={{
              background: 'var(--surface-alt)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                <User size={15} />
                <span>Patient Details</span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {appointment.patientName}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                No: <strong>{appointment.patientNumber}</strong> • Phone: {appointment.patientContactNumber}
              </div>
            </div>

            {/* Doctor card */}
            <div style={{
              background: 'var(--surface-alt)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                <Stethoscope size={15} />
                <span>Attending Doctor</span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {appointment.doctorName}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {appointment.doctorSpecialization} • {appointment.departmentName}
              </div>
            </div>
          </div>

          {/* Schedule details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{appointment.appointmentDate}</div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Slot Time</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{appointment.appointmentTime?.substring(0, 5)}</div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Queue</div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>Token #{appointment.queueNumber}</div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consultation Fee</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--success)' }}>
                LKR {Number(appointment.consultationFee || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Reason & Notes */}
          <div style={{ marginBottom: '1.25rem' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chief Complaint / Reason:</strong>
            <p style={{ margin: '0.25rem 0 0.75rem', background: 'var(--surface-alt)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              {appointment.reason || 'No specific complaint entered.'}
            </p>

            {appointment.notes && (
              <>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Internal Staff Notes:</strong>
                <p style={{ margin: '0.25rem 0 0', background: 'var(--surface-alt)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', whiteSpace: 'pre-line' }}>
                  {appointment.notes}
                </p>
              </>
            )}
          </div>

          {/* Cancellation Info if cancelled */}
          {appointment.status === 'CANCELLED' && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-light)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              <strong>Cancellation Details:</strong>
              <div style={{ marginTop: '0.25rem' }}>Reason: {appointment.cancellationReason || 'Not stated'}</div>
              {appointment.cancelledByName && (
                <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.2rem' }}>
                  Cancelled by {appointment.cancelledByName} at {appointment.cancelledAt ? new Date(appointment.cancelledAt).toLocaleString() : ''}
                </div>
              )}
            </div>
          )}

          {/* Status Progression Actions */}
          {!isFinal && (
            <div style={{
              padding: '1rem',
              background: 'var(--surface-alt)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.65rem' }}>
                Update Appointment Lifecycle:
              </span>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {appointment.status === 'SCHEDULED' && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus('CONFIRMED')}
                    className="btn btn-sm btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Confirm Patient Arrival</span>
                  </button>
                )}

                {(appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED' || appointment.status === 'RESCHEDULED') && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus('IN_PROGRESS')}
                    className="btn btn-sm"
                    style={{ background: '#f59e0b', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Play size={15} />
                    <span>Start Consultation</span>
                  </button>
                )}

                {appointment.status === 'IN_PROGRESS' && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="btn btn-sm btn-success"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Complete Consultation</span>
                  </button>
                )}

                <button
                  disabled={updating}
                  onClick={() => {
                    onClose()
                    onOpenReschedule(appointment)
                  }}
                  className="btn btn-sm btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <RefreshCw size={14} />
                  <span>Reschedule</span>
                </button>

                <button
                  disabled={updating}
                  onClick={() => {
                    onClose()
                    onOpenCancel(appointment)
                  }}
                  className="btn btn-sm"
                  style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-light)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <XCircle size={14} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.9rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
