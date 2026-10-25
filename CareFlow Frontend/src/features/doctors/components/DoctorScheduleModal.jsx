import { useState, useEffect } from 'react'
import { doctorApi } from '../api/doctorApi'
import { X, Calendar, Clock, Plus, Trash2, Edit2, Loader2, AlertCircle, CheckCircle2, User } from 'lucide-react'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export default function DoctorScheduleModal({ isOpen, onClose, doctor }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Adding or editing state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState(null)
  const [formData, setFormData] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '12:00',
    maxPatients: 20,
    slotDurationMinutes: 15,
    roomNumber: '',
    isActive: true
  })

  useEffect(() => {
    if (isOpen && doctor) {
      loadSchedules()
      setIsFormOpen(false)
      setEditingScheduleId(null)
      setError('')
      setSuccess('')
    }
  }, [isOpen, doctor])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const data = await doctorApi.getDoctorSchedules(doctor.id)
      setSchedules(data || [])
    } catch (err) {
      setError('Failed to fetch doctor schedules.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !doctor) return null

  const handleOpenAdd = () => {
    setFormData({
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '12:00',
      maxPatients: 20,
      slotDurationMinutes: 15,
      roomNumber: doctor.roomNumber || '',
      isActive: true
    })
    setEditingScheduleId(null)
    setIsFormOpen(true)
    setError('')
  }

  const handleOpenEdit = (sched) => {
    setFormData({
      dayOfWeek: sched.dayOfWeek,
      startTime: sched.startTime?.substring(0, 5) || '09:00',
      endTime: sched.endTime?.substring(0, 5) || '12:00',
      maxPatients: sched.maxPatients || 20,
      slotDurationMinutes: sched.slotDurationMinutes || 15,
      roomNumber: sched.roomNumber || doctor.roomNumber || '',
      isActive: sched.isActive !== false
    })
    setEditingScheduleId(sched.id)
    setIsFormOpen(true)
    setError('')
  }

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to remove this working schedule?')) return
    setError('')
    try {
      await doctorApi.deleteDoctorSchedule(doctor.id, scheduleId)
      setSuccess('Schedule removed successfully.')
      loadSchedules()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete schedule.')
    }
  }

  const handleSubmitSchedule = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.startTime >= formData.endTime) {
      setError('Start time must be strictly before end time.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        startTime: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
        endTime: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime,
        maxPatients: Number(formData.maxPatients),
        slotDurationMinutes: Number(formData.slotDurationMinutes)
      }

      if (editingScheduleId) {
        await doctorApi.updateDoctorSchedule(doctor.id, editingScheduleId, payload)
        setSuccess('Schedule updated successfully!')
      } else {
        await doctorApi.createDoctorSchedule(doctor.id, payload)
        setSuccess('New schedule shift added successfully!')
      }

      setIsFormOpen(false)
      setEditingScheduleId(null)
      loadSchedules()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save schedule shift.')
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
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                Manage Schedule: Dr. {doctor.firstName} {doctor.lastName}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {doctor.specialization} • Department: {doctor.departmentName}
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

          {success && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              border: '1px solid var(--success-light)',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* Action button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Working Shifts ({schedules.length})
            </span>
            {!isFormOpen && (
              <button
                onClick={handleOpenAdd}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={16} />
                <span>Add Shift</span>
              </button>
            )}
          </div>

          {/* Form to Add / Edit */}
          {isFormOpen && (
            <form onSubmit={handleSubmitSchedule} style={{
              background: 'var(--surface-alt)',
              padding: '1.2rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {editingScheduleId ? 'Edit Shift Details' : 'Add New Shift'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Day of Week
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    className="form-control"
                    required
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Max Patients
                  </label>
                  <input
                    type="number"
                    value={formData.maxPatients}
                    onChange={(e) => setFormData({ ...formData, maxPatients: e.target.value })}
                    min="1"
                    max="100"
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Slot Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={formData.slotDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, slotDurationMinutes: e.target.value })}
                    min="5"
                    max="120"
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g. Room 102"
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingScheduleId ? 'Save Changes' : 'Add Shift'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Existing Schedules List */}
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
              <div>Loading doctor schedules...</div>
            </div>
          ) : schedules.length === 0 ? (
            <div style={{
              padding: '2.5rem',
              textAlign: 'center',
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)'
            }}>
              <Clock size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No recurring shifts configured yet.</p>
              <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                Add weekly working hours to enable appointment booking.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {schedules.map(sched => (
                <div
                  key={sched.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      minWidth: '95px',
                      textAlign: 'center'
                    }}>
                      {sched.dayOfWeek}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                        <Clock size={15} color="var(--primary)" />
                        <span>{sched.startTime?.substring(0, 5)} - {sched.endTime?.substring(0, 5)}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Cap: <strong>{sched.maxPatients} patients</strong> • Slot: <strong>{sched.slotDurationMinutes} mins</strong> {sched.roomNumber && `• Room: ${sched.roomNumber}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => handleOpenEdit(sched)}
                      className="btn btn-icon"
                      title="Edit Shift"
                      style={{ border: '1px solid var(--border)', background: 'transparent' }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(sched.id)}
                      className="btn btn-icon"
                      title="Delete Shift"
                      style={{ border: '1px solid var(--danger-light)', background: 'var(--danger-bg)', color: 'var(--danger)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.9rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
