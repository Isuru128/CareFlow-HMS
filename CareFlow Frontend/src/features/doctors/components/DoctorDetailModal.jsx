import { X, Stethoscope, Mail, Phone, Calendar, Clock, DollarSign, Award, MapPin, Building, ShieldCheck } from 'lucide-react'
import DoctorStatusBadge from './DoctorStatusBadge'

export default function DoctorDetailModal({ isOpen, onClose, doctor, onManageSchedule, onEdit }) {
  if (!isOpen || !doctor) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '720px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with profile banner */}
        <div style={{
          background: 'linear-gradient(135deg, #075985 0%, #0284c7 100%)',
          color: '#ffffff',
          padding: '1.5rem',
          position: 'relative',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.5rem',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
            }}>
              {doctor.firstName?.[0]}{doctor.lastName?.[0]}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                  Dr. {doctor.firstName} {doctor.lastName}
                </h2>
                <DoctorStatusBadge status={doctor.status} />
              </div>
              <p style={{ margin: '0.2rem 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                {doctor.specialization} • ID: <strong>{doctor.doctorNumber}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto', padding: '1.25rem' }}>
          {/* Quick stats pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--surface-alt)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Department</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {doctor.departmentName} ({doctor.departmentCode})
              </div>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consultation Fee</div>
              <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                LKR {Number(doctor.consultationFee).toLocaleString()}
              </div>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Experience</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {doctor.experienceYears || 0} Years Active
              </div>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room / Clinic</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {doctor.roomNumber || 'Not assigned'}
              </div>
            </div>
          </div>

          {/* Details breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em', marginBottom: '0.5rem', fontWeight: 700 }}>
                Credentials & Contact
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Medical License: </strong>
                  <span>{doctor.licenseNumber}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Qualifications: </strong>
                  <span>{doctor.qualification}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Phone: </strong>
                  <span>{doctor.contactNumber}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Email: </strong>
                  <span>{doctor.email || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em', marginBottom: '0.5rem', fontWeight: 700 }}>
                Clinical Activity
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Total Appointments: </strong>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{doctor.totalAppointments || 0}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Registered Since: </strong>
                  <span>{doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Registered By: </strong>
                  <span>{doctor.registeredByName || 'System'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {doctor.bio && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em', marginBottom: '0.35rem', fontWeight: 700 }}>
                Biography & Profile
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, background: 'var(--surface-alt)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', margin: 0 }}>
                {doctor.bio}
              </p>
            </div>
          )}

          {/* Working Shifts */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em', margin: 0, fontWeight: 700 }}>
                Active Working Shifts ({doctor.schedules?.length || 0})
              </h4>
              {onManageSchedule && (
                <button
                  onClick={() => {
                    onClose()
                    onManageSchedule(doctor)
                  }}
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  Manage Shifts
                </button>
              )}
            </div>

            {(!doctor.schedules || doctor.schedules.length === 0) ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                No active shifts configured for this doctor.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {doctor.schedules.map(s => (
                  <div
                    key={s.id}
                    style={{
                      background: 'var(--surface-alt)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.dayOfWeek}</div>
                    <div>{s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Cap: {s.maxPatients} patients ({s.slotDurationMinutes} min slots)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.9rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <div>
            {onEdit && (
              <button
                onClick={() => {
                  onClose()
                  onEdit(doctor)
                }}
                className="btn btn-secondary btn-sm"
              >
                Edit Doctor Profile
              </button>
            )}
          </div>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
