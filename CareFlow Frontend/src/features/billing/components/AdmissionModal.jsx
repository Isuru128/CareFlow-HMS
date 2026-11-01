import React, { useState, useEffect } from 'react'
import { X, BedDouble, CheckCircle2, AlertCircle } from 'lucide-react'
import { billingApi } from '../api/billingApi'

const ROOM_PRESETS = {
  GENERAL_WARD: { ward: 'General Medical Ward', roomRate: 2500, nursingFee: 1000 },
  SEMI_PRIVATE: { ward: 'Cardiology Observation Ward', roomRate: 6500, nursingFee: 1500 },
  PRIVATE_ROOM: { ward: 'Private Wing - Level 3', roomRate: 12000, nursingFee: 2500 },
  DELUXE_SUITE: { ward: 'Executive Deluxe Wing', roomRate: 20000, nursingFee: 4000 },
  ICU: { ward: 'Intensive Care Unit (ICU)', roomRate: 28000, nursingFee: 7000 },
  NICU: { ward: 'Neonatal Intensive Care Unit', roomRate: 25000, nursingFee: 6000 },
  EMERGENCY_OBSERVATION: { ward: 'Emergency Observation Unit', roomRate: 4000, nursingFee: 1500 }
}

export default function AdmissionModal({ isOpen, onClose, onAdmissionCreated }) {
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])

  const [patientId, setPatientId] = useState('')
  const [attendingDoctorId, setAttendingDoctorId] = useState('')
  const [roomType, setRoomType] = useState('SEMI_PRIVATE')
  const [wardName, setWardName] = useState('Cardiology Observation Ward')
  const [bedNumber, setBedNumber] = useState('')
  const [dailyRoomRate, setDailyRoomRate] = useState(6500)
  const [nursingFeePerDay, setNursingFeePerDay] = useState(1500)
  const [admissionReason, setAdmissionReason] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        billingApi.getPatientsList().catch(() => []),
        billingApi.getDoctorsList().catch(() => [])
      ]).then(([pts, docs]) => {
        setPatients(pts)
        setDoctors(docs)
      })
      setPatientId('')
      setAttendingDoctorId('')
      setRoomType('SEMI_PRIVATE')
      setWardName('Cardiology Observation Ward')
      setBedNumber('')
      setDailyRoomRate(6500)
      setNursingFeePerDay(1500)
      setAdmissionReason('')
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleRoomTypeChange = (type) => {
    setRoomType(type)
    const preset = ROOM_PRESETS[type]
    if (preset) {
      setWardName(preset.ward)
      setDailyRoomRate(preset.roomRate)
      setNursingFeePerDay(preset.nursingFee)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!patientId) {
      setError('Please select a patient.')
      return
    }
    if (!bedNumber.trim()) {
      setError('Please enter a bed or room number.')
      return
    }

    try {
      setLoading(true)
      const created = await billingApi.createAdmission({
        patientId: Number(patientId),
        attendingDoctorId: attendingDoctorId ? Number(attendingDoctorId) : null,
        wardName: wardName.trim(),
        roomType,
        bedNumber: bedNumber.trim(),
        dailyRoomRate: Number(dailyRoomRate) || 0,
        nursingFeePerDay: Number(nursingFeePerDay) || 0,
        admissionReason: admissionReason.trim() || null
      })
      onAdmissionCreated?.(created)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create inpatient admission.')
    } finally {
      setLoading(false)
    }
  }

  const totalDailyCharge = (Number(dailyRoomRate) || 0) + (Number(nursingFeePerDay) || 0)

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '640px', width: '95%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#fef3c7',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BedDouble size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                New Inpatient Admission & Bed Allocation
              </h3>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Register ward stay and daily room & nursing tariffs for admission billing
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 0 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label className="form-label">Select Patient *</label>
              <select
                className="form-select"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.patientNumber} — {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Attending Doctor</label>
              <select
                className="form-select"
                value={attendingDoctorId}
                onChange={(e) => setAttendingDoctorId(e.target.value)}
              >
                <option value="">-- Optional Attending Doctor --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.firstName} {d.lastName} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px', gap: '0.85rem' }}>
            <div>
              <label className="form-label">Room / Ward Category *</label>
              <select
                className="form-select"
                value={roomType}
                onChange={(e) => handleRoomTypeChange(e.target.value)}
              >
                <option value="GENERAL_WARD">General Ward</option>
                <option value="SEMI_PRIVATE">Semi-Private Room</option>
                <option value="PRIVATE_ROOM">Private Room</option>
                <option value="DELUXE_SUITE">Deluxe Suite</option>
                <option value="ICU">Intensive Care (ICU)</option>
                <option value="NICU">Neonatal ICU (NICU)</option>
                <option value="EMERGENCY_OBSERVATION">Emergency Observation</option>
              </select>
            </div>

            <div>
              <label className="form-label">Ward Name *</label>
              <input
                type="text"
                className="form-input"
                value={wardName}
                onChange={(e) => setWardName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Bed No. *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. B-204"
                value={bedNumber}
                onChange={(e) => setBedNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', alignItems: 'end' }}>
            <div>
              <label className="form-label">Daily Room Rate (LKR) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                value={dailyRoomRate}
                onChange={(e) => setDailyRoomRate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Nursing Fee / Day (LKR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                value={nursingFeePerDay}
                onChange={(e) => setNursingFeePerDay(e.target.value)}
              />
            </div>

            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '0.55rem 0.75rem',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Tariff / Day
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#b45309' }}>
                LKR {totalDailyCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Admission Clinical Reason / Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Clinical indication for inpatient admission..."
              value={admissionReason}
              onChange={(e) => setAdmissionReason(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '0 -1.5rem -1.5rem', padding: '1rem 1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <CheckCircle2 size={16} />
              <span>{loading ? 'Admitting...' : 'Confirm Inpatient Admission'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

