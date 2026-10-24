import { useState, useEffect } from 'react'
import { appointmentApi } from '../api/appointmentApi'
import { doctorApi } from '../../doctors/api/doctorApi'
import { X, Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react'

export default function RescheduleAppointmentModal({ isOpen, onClose, onSuccess, appointment }) {
  const todayStr = new Date().toISOString().split('T')[0]

  const [appointmentDate, setAppointmentDate] = useState(todayStr)
  const [appointmentTime, setAppointmentTime] = useState('')
  const [reason, setReason] = useState('')
  const [availableSlotData, setAvailableSlotData] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && appointment) {
      const initDate = appointment.appointmentDate >= todayStr ? appointment.appointmentDate : todayStr
      setAppointmentDate(initDate)
      setAppointmentTime(appointment.appointmentTime?.substring(0, 5) || '')
      setReason('')
      setError('')
      fetchSlots(appointment.doctorId, initDate)
    }
  }, [isOpen, appointment])

  const fetchSlots = async (doctorId, date) => {
    if (!doctorId || !date) return
    setLoadingSlots(true)
    try {
      const data = await doctorApi.getAvailableSlots(doctorId, date)
      setAvailableSlotData(data)
    } catch (err) {
      setAvailableSlotData(null)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateChange = (e) => {
    const newDate = e.target.value
    setAppointmentDate(newDate)
    fetchSlots(appointment.doctorId, newDate)
  }

  if (!isOpen || !appointment) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!appointmentDate) {
      setError('Please select a new date.')
      return
    }
    if (!appointmentTime) {
      setError('Please select a time.')
      return
    }

    setSubmitting(true)
    try {
      const timePayload = appointmentTime.length === 5 ? `${appointmentTime}:00` : appointmentTime
      await appointmentApi.rescheduleAppointment(appointment.id, {
        appointmentDate,
        appointmentTime: timePayload,
        reason
      })

      onSuccess(`Appointment ${appointment.appointmentNumber} successfully rescheduled to ${appointmentDate} at ${appointmentTime}`)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule appointment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '600px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--warning-light)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                Reschedule Appointment
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {appointment.appointmentNumber} • {appointment.patientName} (Dr. {appointment.doctorName})
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

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '1.25rem' }}>
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid var(--danger-light)',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div style={{
              background: 'var(--surface-alt)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Current Appointment: </span>
              <strong>{appointment.appointmentDate}</strong> at <strong>{appointment.appointmentTime?.substring(0, 5)}</strong> (Queue #{appointment.queueNumber})
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  New Date *
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={appointmentDate}
                  onChange={handleDateChange}
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                  New Time *
                </label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
            </div>

            {/* Slots available */}
            {availableSlotData && availableSlotData.timeSlots && availableSlotData.timeSlots.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Doctor Shifts for {appointmentDate}:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '100px', overflowY: 'auto' }}>
                  {availableSlotData.timeSlots.map((slot, idx) => {
                    const timeStr = slot.time.substring(0, 5)
                    const isSelected = appointmentTime === timeStr
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setAppointmentTime(timeStr)}
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          cursor: slot.isAvailable ? 'pointer' : 'not-allowed',
                          opacity: slot.isAvailable ? 1 : 0.4
                        }}
                      >
                        {timeStr}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                Reason for Rescheduling
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Patient travel delay, doctor shift adjustment..."
                className="form-control"
                rows={2}
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
              Back
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <span>Save & Reschedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
