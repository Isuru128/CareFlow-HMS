import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { patientApi } from '../../features/patients/api/patientApi'
import { doctorApi } from '../../features/doctors/api/doctorApi'
import { appointmentApi } from '../../features/appointments/api/appointmentApi'
import { labApi } from '../../features/lab/api/labApi'
import {
  Users,
  Shield,
  HeartPulse,
  UserCheck,
  Stethoscope,
  Activity,
  ArrowRight,
  CalendarCheck,
  Clock,
  CheckCircle2,
  Building2,
  Plus,
  FlaskConical
} from 'lucide-react'

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [patientStats, setPatientStats] = useState(null)
  const [doctorStats, setDoctorStats] = useState(null)
  const [appointmentStats, setAppointmentStats] = useState(null)
  const [labStats, setLabStats] = useState(null)

  useEffect(() => {
    patientApi.getPatientStats().then(setPatientStats).catch(() => {})
    doctorApi.getDoctorStats().then(setDoctorStats).catch(() => {})
    appointmentApi.getAppointmentStats().then(setAppointmentStats).catch(() => {})
    labApi.getSummaryStats().then(setLabStats).catch(() => {})
  }, [])

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
          Welcome back, {user?.firstName} {user?.lastName}!
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          CareFlow Hospital Management Platform • Role: <strong style={{ color: 'var(--primary)' }}>{user?.roles?.map(r => r.replace('ROLE_', '')).join(', ')}</strong>
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
                <HeartPulse size={28} />
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
              Register new patients, view electronic medical records (EMR), attach lab reports, and manage medical histories.
            </p>

            {patientStats && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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

        {/* Doctor Management Card */}
        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #0284c7' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{
                display: 'inline-flex',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#e0f2fe',
                color: '#0284c7'
              }}>
                <Stethoscope size={28} />
              </div>

              {doctorStats && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7' }}>
                    {doctorStats.totalDoctors}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Physicians</div>
                </div>
              )}
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Doctor Management</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Manage clinical specialists, medical licenses, department assignments, and configure recurring weekly working schedules.
            </p>

            {doctorStats && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', background: 'var(--success-bg)', color: '#065f46', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  {doctorStats.activeDoctors} Active Practice
                </span>
                <span style={{ fontSize: '0.75rem', background: '#ede9fe', color: '#6d28d9', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  {doctorStats.totalDepartments} Departments
                </span>
              </div>
            )}
          </div>

          <Link to="/doctors" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Manage Doctors & Shifts</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Appointment Management Card */}
        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #10b981' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{
                display: 'inline-flex',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ecfdf5',
                color: '#10b981'
              }}>
                <CalendarCheck size={28} />
              </div>

              {appointmentStats && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
                    {appointmentStats.todayAppointments}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Appointments Today</div>
                </div>
              )}
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Appointments & Scheduling</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Book doctor consultations, allocate tokens, view clinic calendar schedules, track patient queues and reschedules.
            </p>

            {appointmentStats && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  {appointmentStats.todayInProgress} In Progress
                </span>
                <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#047857', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  {appointmentStats.todayCompleted} Completed
                </span>
                <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  {appointmentStats.upcomingAppointments} Upcoming
                </span>
              </div>
            )}
          </div>

          <Link to="/appointments" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>View Appointments & Calendar</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Laboratory Management Card */}
        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #0284c7' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{
                display: 'inline-flex',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)'
              }}>
                <FlaskConical size={28} />
              </div>

              {labStats && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {labStats.totalRequests}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Lab Orders</div>
                </div>
              )}
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Laboratory Services</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Process test requisitions, collect barcode specimens, quantify diagnostic results, and certify lab reports.
            </p>

            {labStats && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  {labStats.requestedCount} Pending Collection
                </span>
                <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#047857', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  {labStats.completedCount} Completed
                </span>
                {labStats.urgentStatCount > 0 && (
                  <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                    {labStats.urgentStatCount} STAT / Urgent
                  </span>
                )}
              </div>
            )}
          </div>

          <Link to="/laboratory" className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Go to Laboratory</span>
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
        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #8b5cf6' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ede9fe',
              color: '#8b5cf6',
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
