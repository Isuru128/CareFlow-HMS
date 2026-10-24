import { useState, useEffect } from 'react'
import { appointmentApi } from '../../features/appointments/api/appointmentApi'
import { doctorApi } from '../../features/doctors/api/doctorApi'
import BookAppointmentModal from '../../features/appointments/components/BookAppointmentModal'
import RescheduleAppointmentModal from '../../features/appointments/components/RescheduleAppointmentModal'
import CancelAppointmentModal from '../../features/appointments/components/CancelAppointmentModal'
import AppointmentDetailModal from '../../features/appointments/components/AppointmentDetailModal'
import AppointmentStatusBadge from '../../features/appointments/components/AppointmentStatusBadge'
import AppointmentCalendarView from '../../features/appointments/components/AppointmentCalendarView'
import { useAuth } from '../../context/AuthContext'
import {
  Calendar,
  CalendarCheck,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Stethoscope,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  List,
  CalendarDays,
  XCircle,
  Play
} from 'lucide-react'

export default function AppointmentListPage() {
  const { user } = useAuth()

  const [viewMode, setViewMode] = useState('list') // 'list' | 'calendar'
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])

  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedDoctorId, setSelectedDoctorId] = useState('ALL')
  const [selectedDeptId, setSelectedDeptId] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Modals & Feedback
  const [feedback, setFeedback] = useState({ error: '', success: '' })
  const [isBookModalOpen, setIsBookModalOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [initialBookingDate, setInitialBookingDate] = useState(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchStats()
    fetchMetadata()
  }, [])

  useEffect(() => {
    if (viewMode === 'list') {
      fetchAppointments(0)
    }
  }, [debouncedSearch, selectedDoctorId, selectedDeptId, statusFilter, startDate, endDate, viewMode])

  const fetchStats = async () => {
    try {
      const data = await appointmentApi.getAppointmentStats()
      setStats(data)
    } catch (err) {
      // Non-critical
    }
  }

  const fetchMetadata = async () => {
    try {
      const [docData, deptData] = await Promise.all([
        doctorApi.getActiveDoctorsSummary(),
        doctorApi.getDepartments(true)
      ])
      setDoctors(docData || [])
      setDepartments(deptData || [])
    } catch (err) {
      // Non-critical
    }
  }

  const fetchAppointments = async (page = 0) => {
    setLoading(true)
    setFeedback({ error: '', success: '' })
    try {
      const data = await appointmentApi.getAppointments({
        query: debouncedSearch,
        doctorId: selectedDoctorId,
        departmentId: selectedDeptId,
        status: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size: pageSize
      })
      setAppointments(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
      setCurrentPage(data.number || 0)
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Failed to load appointments from server.',
        success: ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetailById = async (id) => {
    try {
      const data = await appointmentApi.getAppointmentById(id)
      setSelectedAppointment(data)
      setIsDetailModalOpen(true)
    } catch (err) {
      setFeedback({ error: 'Failed to retrieve appointment details.', success: '' })
    }
  }

  const handleOpenReschedule = (apt) => {
    setSelectedAppointment(apt)
    setIsRescheduleModalOpen(true)
  }

  const handleOpenCancel = (apt) => {
    setSelectedAppointment(apt)
    setIsCancelModalOpen(true)
  }

  const handleBookOnCalendarDate = (dateStr) => {
    setInitialBookingDate(dateStr)
    setIsBookModalOpen(true)
  }

  const handleQuickStatus = async (apt, newStatus) => {
    try {
      await appointmentApi.updateAppointmentStatus(apt.id, newStatus)
      setFeedback({ error: '', success: `Appointment status updated to ${newStatus}` })
      fetchAppointments(currentPage)
      fetchStats()
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to update status.', success: '' })
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Appointment Management & Scheduling
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Book consultations, track live patient queues, manage calendar schedules and status lifecycles
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--surface-alt)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'list' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: viewMode === 'list' ? 700 : 500,
                boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              <List size={15} />
              <span>Table</span>
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'calendar' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'calendar' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: viewMode === 'calendar' ? 700 : 500,
                boxShadow: viewMode === 'calendar' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              <CalendarDays size={15} />
              <span>Calendar</span>
            </button>
          </div>

          <button
            onClick={() => {
              setInitialBookingDate(null)
              setIsBookModalOpen(true)
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Plus size={18} />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1rem 1.2rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Bookings</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {stats.totalAppointments}
            </div>
          </div>

          <div className="card" style={{ padding: '1rem 1.2rem', borderLeft: '4px solid #0284c7' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Total</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7', marginTop: '0.2rem' }}>
              {stats.todayAppointments}
            </div>
          </div>

          <div className="card" style={{ padding: '1rem 1.2rem', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>In Progress Today</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>
              {stats.todayInProgress}
            </div>
          </div>

          <div className="card" style={{ padding: '1rem 1.2rem', borderLeft: '4px solid var(--success)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Today</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.2rem' }}>
              {stats.todayCompleted}
            </div>
          </div>

          <div className="card" style={{ padding: '1rem 1.2rem', borderLeft: '4px solid #7c3aed' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Upcoming</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.2rem' }}>
              {stats.upcomingAppointments}
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {feedback.error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.2rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)',
          border: '1px solid var(--danger-light)',
          marginBottom: '1.25rem',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={20} />
          <span>{feedback.error}</span>
        </div>
      )}

      {feedback.success && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.2rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success)',
          border: '1px solid var(--success-light)',
          marginBottom: '1.25rem',
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={20} />
          <span>{feedback.success}</span>
        </div>
      )}

      {/* Mode View switch */}
      {viewMode === 'calendar' ? (
        <AppointmentCalendarView
          onSelectAppointment={handleOpenDetailById}
          onBookOnDate={handleBookOnCalendarDate}
        />
      ) : (
        <>
          {/* Filters Bar */}
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  placeholder="Patient, doctor or ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                />
              </div>

              {/* Doctor */}
              <div>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="form-control"
                >
                  <option value="ALL">All Doctors</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="form-control"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-control"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="RESCHEDULED">RESCHEDULED</option>
                </select>
              </div>

              {/* Date Filters */}
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-control"
                  title="Filter from date"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Token / ID</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Patient</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Doctor & Dept</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Schedule</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
                        <div>Loading appointment records...</div>
                      </td>
                    </tr>
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Calendar size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                        <p style={{ margin: 0, fontWeight: 600 }}>No appointments found.</p>
                      </td>
                    </tr>
                  ) : (
                    appointments.map((apt) => (
                      <tr key={apt.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}>
                        {/* Token / ID */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              flexShrink: 0
                            }}>
                              #{apt.queueNumber}
                            </span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{apt.appointmentNumber}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fee: LKR {Number(apt.consultationFee || 0).toLocaleString()}</div>
                            </div>
                          </div>
                        </td>

                        {/* Patient */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            {apt.patientName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {apt.patientNumber} • {apt.patientContactNumber}
                          </div>
                        </td>

                        {/* Doctor & Dept */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                            {apt.doctorName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {apt.doctorSpecialization} • {apt.departmentName}
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            {apt.appointmentDate}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} />
                            <span>{apt.appointmentTime?.substring(0, 5)}</span>
                          </div>
                        </td>

                        {/* Type */}
                        <td style={{ padding: '0.9rem 1rem', fontSize: '0.8rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--surface-alt)',
                            border: '1px solid var(--border)',
                            fontWeight: 600
                          }}>
                            {apt.appointmentType}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <AppointmentStatusBadge status={apt.status} />
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt)
                                setIsDetailModalOpen(true)
                              }}
                              className="btn btn-icon"
                              title="View Details"
                              style={{ border: '1px solid var(--border)', background: 'transparent' }}
                            >
                              <Eye size={15} />
                            </button>

                            {apt.status === 'SCHEDULED' && (
                              <button
                                onClick={() => handleQuickStatus(apt, 'CONFIRMED')}
                                className="btn btn-icon"
                                title="Confirm Patient Arrival"
                                style={{ border: '1px solid #ddd6fe', background: '#ede9fe', color: '#7c3aed' }}
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}

                            {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'RESCHEDULED') && (
                              <button
                                onClick={() => handleQuickStatus(apt, 'IN_PROGRESS')}
                                className="btn btn-icon"
                                title="Start Consultation"
                                style={{ border: '1px solid #fde68a', background: '#fef3c7', color: '#d97706' }}
                              >
                                <Play size={15} />
                              </button>
                            )}

                            {apt.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleQuickStatus(apt, 'COMPLETED')}
                                className="btn btn-icon"
                                title="Complete Consultation"
                                style={{ border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#059669' }}
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}

                            {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleOpenReschedule(apt)}
                                className="btn btn-icon"
                                title="Reschedule Appointment"
                                style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--primary)' }}
                              >
                                <RefreshCw size={14} />
                              </button>
                            )}

                            {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleOpenCancel(apt)}
                                className="btn btn-icon"
                                title="Cancel Appointment"
                                style={{ border: '1px solid var(--danger-light)', background: 'var(--danger-bg)', color: 'var(--danger)' }}
                              >
                                <XCircle size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface-alt)',
                fontSize: '0.85rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} appointments
                </span>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    disabled={currentPage === 0}
                    onClick={() => fetchAppointments(currentPage - 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => fetchAppointments(currentPage + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={(msg) => {
          setFeedback({ error: '', success: msg })
          fetchAppointments(currentPage)
          fetchStats()
        }}
      />

      <RescheduleAppointmentModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        onSuccess={(msg) => {
          setFeedback({ error: '', success: msg })
          fetchAppointments(currentPage)
          fetchStats()
        }}
        appointment={selectedAppointment}
      />

      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={(msg) => {
          setFeedback({ error: '', success: msg })
          fetchAppointments(currentPage)
          fetchStats()
        }}
        appointment={selectedAppointment}
      />

      <AppointmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        appointment={selectedAppointment}
        onStatusUpdated={(msg) => {
          setFeedback({ error: '', success: msg })
          fetchAppointments(currentPage)
          fetchStats()
        }}
        onOpenReschedule={(apt) => handleOpenReschedule(apt)}
        onOpenCancel={(apt) => handleOpenCancel(apt)}
      />
    </div>
  )
}
