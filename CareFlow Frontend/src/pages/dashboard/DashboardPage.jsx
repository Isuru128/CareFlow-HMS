import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { patientApi } from '../../features/patients/api/patientApi'
import {
  Users,
  Shield,
  HeartPulse,
  UserCheck,
  Stethoscope,
  Activity,
  ArrowRight,
  Calendar,
  FileText
} from 'lucide-react'

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [patientStats, setPatientStats] = useState(null)

  useEffect(() => {
    patientApi.getPatientStats()
      .then((data) => setPatientStats(data))
      .catch(() => {})
  }, [])

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
          Welcome back, {user?.firstName} {user?.lastName}!
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Hospital Management Portal • Role: <strong style={{ color: 'var(--primary)' }}>{user?.roles?.map(r => r.replace('ROLE_', '')).join(', ')}</strong>
        </p>
      </div>

      {/* Main Feature Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Patient Management Card */}
        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--primary)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{
                display: 'inline-flex',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)'
              }}>
                <Stethoscope size={28} />
              </div>

              {patientStats && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {patientStats.totalPatients}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Patients</div>
                </div>
              )}
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Patient Management</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Register new patients, view complete electronic medical records (EMR), attach lab & scan documents, and track diagnosis histories.
            </p>

            {patientStats && (
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', background: 'var(--success-bg)', color: '#065f46', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  {patientStats.activePatients} Active Patients
                </span>
                <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4338ca', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  {patientStats.newPatientsToday} Registered Today
                </span>
              </div>
            )}
          </div>

          <Link to="/patients" className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Go to Patient Directory</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* User Management Card (Admin) */}
        {isAdmin && (
          <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #6366f1' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#e0e7ff',
                color: '#4f46e5',
                marginBottom: '1rem'
              }}>
                <Users size={28} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>User Management</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Create accounts, assign doctor/nurse/staff roles, lock or activate user credentials.
              </p>
            </div>
            <Link to="/users" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Manage System Users</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Account Profile Card */}
        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #10b981' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ecfdf5',
              color: '#10b981',
              marginBottom: '1rem'
            }}>
              <UserCheck size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Account Profile</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Review personal contact information, check assigned system privileges, and change account password.
            </p>
          </div>
          <Link to="/profile" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>View My Profile</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
