import { useState, useEffect } from 'react'
import { appointmentApi } from '../api/appointmentApi'
import { doctorApi } from '../../doctors/api/doctorApi'
import { patientApi } from '../../patients/api/patientApi'
import { X, Calendar, Clock, User, Stethoscope, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'

export default function BookAppointmentModal({ isOpen, onClose, onSuccess, initialDoctorId = null, initialPatientId = null }) {
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loadingInitial, setLoadingInitial] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: todayStr,
    appointmentTime: '',
    appointmentType: 'CONSULTATION',
    reason: '',
    notes: '',
    consultationFee: 2500
  })

  const [availableSlotData, setAvailableSlotData] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
      setError('')
      setAvailableSlotData(null)
    }
  }, [isOpen])

  const loadInitialData = async () => {
    setLoadingInitial(true)
    try {
      const [patRes, docRes] = await Promise.all([
        patientApi.getPatients({ size: 100 }),
        doctorApi.getActiveDoctorsSummary()
      ])

      const patList = patRes.content || []
      const docList = docRes || []

      setPatients(patList)
      setDoctors(docList)

      const selectedDocId = initialDoctorId || (docList.length > 0 ? docList[0].id : '')
      const selectedPatId = initialPatientId || (patList.length > 0 ? patList[0].id : '')

      const initialDoc = docList.find(d => String(d.id) === String(selectedDocId))

      setFormData(prev => ({
        ...prev,
        doctorId: selectedDocId,
        patientId: selectedPatId,
        appointmentDate: todayStr,
        appointmentTime: '',
        consultationFee: initialDoc ? initialDoc.consultationFee : 2500
      }))

      if (selectedDocId) {
        fetchSlots(selectedDocId, todayStr)
      }
    } catch (err) {
      setError('Failed to load patient or doctor records.')
    } finally {
      setLoadingInitial(false)
    }
  }

  const fetchSlots = async (doctorId, date) => {
    if (!doctorId || !date) return
    setLoadingSlots(true)
    setFormData(prev => ({ ...prev, appointmentTime: '' }))
    try {
      const data = await doctorApi.getAvailableSlots(doctorId, date)
      setAvailableSlotData(data)
    } catch (err) {
      setAvailableSlotData(null)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDoctorChange = (e) => {
    const docId = e.target.value
    const doc = doctors.find(d => String(d.id) === String(docId))
    setFormData(prev => ({
      ...prev,
      doctorId: docId,
      consultationFee: doc ? doc.consultationFee : prev.consultationFee
    }))
    fetchSlots(docId, formData.appointmentDate)
  }

  const handleDateChange = (e) => {
    const newDate = e.target.value
    setFormData(prev => ({ ...prev, appointmentDate: newDate }))
    fetchSlots(formData.doctorId, newDate)
  }

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.patientId) {
      setError('Please select a patient.')
      return
    }
    if (!formData.doctorId) {
      setError('Please select a doctor.')
      return
    }
    if (!formData.appointmentDate) {
      setError('Please select an appointment date.')
      return
    }
    if (!formData.appointmentTime) {
      setError('Please select a scheduled time slot.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        patientId: Number(formData.patientId),
        doctorId: Number(formData.doctorId),
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime.length === 5 ? `${formData.appointmentTime}:00` : formData.appointmentTime,
        appointmentType: formData.appointmentType,
        reason: formData.reason,
        notes: formData.notes,
        consultationFee: Number(formData.consultationFee)
      }

      const booked = await appointmentApi.bookAppointment(payload)
      onSuccess(`Appointment booked successfully! Ref: ${booked.appointmentNumber} (Queue #${booked.queueNumber})`)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment. Please try another slot.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '750px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
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
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                Book Patient Appointment
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Schedule consultation, allocate queue number & reserve slot
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
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.25rem' }}>
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

            {loadingInitial ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                <div>Loading clinic data...</div>
              </div>
            ) : (
              <>
                {/* Patient & Doctor Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                      Select Patient *
                    </label>
                    <select
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      className="form-control"
                      required
                    >
                      <option value="">Select a patient</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.patientNumber} - {p.firstName} {p.lastName} ({p.contactNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                      Select Doctor *
                    </label>
                    <select
                      value={formData.doctorId}
                      onChange={handleDoctorChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select a doctor</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} ({d.specialization} - {d.departmentName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Fee */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                      Appointment Date *
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={formData.appointmentDate}
                      onChange={handleDateChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                      Appointment Type
                    </label>
                    <select
                      value={formData.appointmentType}
                      onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                      className="form-control"
                    >
                      <option value="CONSULTATION">Standard Consultation</option>
                      <option value="FOLLOW_UP">Follow-up Visit</option>
                      <option value="ROUTINE_CHECKUP">Routine Checkup</option>
                      <option value="EMERGENCY">Emergency Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                      Consultation Fee (LKR)
                    </label>
                    <input
                      type="number"
                      value={formData.consultationFee}
                      onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                      min="0"
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                {/* Slot Selector */}
                <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={16} color="var(--primary)" />
                      <span>Available Time Slots</span>
                    </div>

                    {availableSlotData && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Capacity: {availableSlotData.totalBooked} / {availableSlotData.totalCapacity} booked
                      </span>
                    )}
                  </div>

                  {loadingSlots ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Loader2 size={18} className="animate-spin" style={{ margin: '0 auto 0.25rem' }} />
                      <div>Checking doctor schedule availability...</div>
                    </div>
                  ) : (!availableSlotData || !availableSlotData.timeSlots || availableSlotData.timeSlots.length === 0) ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Dr. does not have an active schedule on this day of the week ({formData.appointmentDate}). Please pick another day or select manual time below.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                      {availableSlotData.timeSlots.map((slot, idx) => {
                        const timeStr = slot.time.substring(0, 5)
                        const isSelected = formData.appointmentTime === timeStr
                        const isAvail = slot.isAvailable

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={!isAvail}
                            onClick={() => setFormData(prev => ({ ...prev, appointmentTime: timeStr }))}
                            style={{
                              padding: '0.4rem 0.2rem',
                              borderRadius: 'var(--radius-sm)',
                              border: isSelected
                                ? '2px solid var(--primary)'
                                : isAvail ? '1px solid var(--border)' : '1px dashed var(--border)',
                              backgroundColor: isSelected
                                ? 'var(--primary)'
                                : isAvail ? 'var(--surface)' : 'var(--surface-alt)',
                              color: isSelected
                                ? '#ffffff'
                                : isAvail ? 'var(--text-main)' : 'var(--text-light)',
                              fontWeight: isSelected ? 700 : 500,
                              fontSize: '0.8rem',
                              cursor: isAvail ? 'pointer' : 'not-allowed',
                              opacity: isAvail ? 1 : 0.45,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {timeStr}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Or custom time:</span>
                    <input
                      type="time"
                      value={formData.appointmentTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                      className="form-control"
                      style={{ width: '130px', padding: '0.3rem 0.5rem', fontSize: '0.825rem' }}
                      required
                    />
                  </div>
                </div>

                {/* Reason & Notes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                      Primary Symptoms / Reason
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="e.g. Chest discomfort, routine checkup..."
                      className="form-control"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                      Internal Staff Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Notes for nursing triage or doctor..."
                      className="form-control"
                      rows={2}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || loadingInitial}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <span>Confirm & Book Appointment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
