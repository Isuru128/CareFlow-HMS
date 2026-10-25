import { useState, useEffect } from 'react'
import { doctorApi } from '../../features/doctors/api/doctorApi'
import DoctorModal from '../../features/doctors/components/DoctorModal'
import DoctorScheduleModal from '../../features/doctors/components/DoctorScheduleModal'
import DepartmentModal from '../../features/doctors/components/DepartmentModal'
import DoctorDetailModal from '../../features/doctors/components/DoctorDetailModal'
import DoctorStatusBadge from '../../features/doctors/components/DoctorStatusBadge'
import { useAuth } from '../../context/AuthContext'
import {
  Stethoscope,
  UserPlus,
  Building2,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Eye,
  Activity,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Phone,
  Mail,
  MoreVertical
} from 'lucide-react'

export default function DoctorListPage() {
  const { user, isAdmin } = useAuth()

  const [doctors, setDoctors] = useState([])
  const [stats, setStats] = useState(null)
  const [departments, setDepartments] = useState([])
  const [specializations, setSpecializations] = useState([])

  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [selectedSpec, setSelectedSpec] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Feedback & Modals
  const [feedback, setFeedback] = useState({ error: '', success: '' })
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  // Debounce search input
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
    fetchDoctors(0)
  }, [debouncedSearch, selectedDept, selectedSpec, statusFilter])

  const fetchStats = async () => {
    try {
      const data = await doctorApi.getDoctorStats()
      setStats(data)
    } catch (err) {
      // Non-critical
    }
  }

  const fetchMetadata = async () => {
    try {
      const [deptData, specData] = await Promise.all([
        doctorApi.getDepartments(false),
        doctorApi.getSpecializations()
      ])
      setDepartments(deptData || [])
      setSpecializations(specData || [])
    } catch (err) {
      // Non-critical
    }
  }

  const fetchDoctors = async (page = 0) => {
    setLoading(true)
    setFeedback({ error: '', success: '' })
    try {
      const data = await doctorApi.getDoctors({
        query: debouncedSearch,
        departmentId: selectedDept,
        specialization: selectedSpec,
        status: statusFilter,
        page,
        size: pageSize
      })
      setDoctors(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
      setCurrentPage(data.number || 0)
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Failed to load doctors from server.',
        success: ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddDoctor = () => {
    setSelectedDoctor(null)
    setIsDoctorModalOpen(true)
  }

  const handleOpenEditDoctor = (doc) => {
    setSelectedDoctor(doc)
    setIsDoctorModalOpen(true)
  }

  const handleOpenSchedules = (doc) => {
    setSelectedDoctor(doc)
    setIsScheduleModalOpen(true)
  }

  const handleOpenDetails = (doc) => {
    setSelectedDoctor(doc)
    setIsDetailModalOpen(true)
  }

  const handleStatusChange = async (doctorId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'ON_LEAVE' : 'ACTIVE'
    if (!window.confirm(`Change doctor status to ${nextStatus}?`)) return
    try {
      await doctorApi.updateDoctorStatus(doctorId, nextStatus)
      setFeedback({ error: '', success: `Doctor status updated to ${nextStatus}` })
      fetchDoctors(currentPage)
      fetchStats()
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to update status.', success: '' })
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Doctor & Department Management
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Manage consultant profiles, clinical departments, qualifications and weekly scheduling shifts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsDeptModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Building2 size={17} />
            <span>Departments</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenAddDoctor}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <UserPlus size={17} />
              <span>Register Doctor</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{stats.totalDoctors}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Doctors</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', color: 'var(--success)' }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{stats.activeDoctors}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Practice</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>{stats.onLeaveDoctors}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>On Leave</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: '#ede9fe', color: '#7c3aed' }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c3aed' }}>{stats.totalDepartments}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Departments</div>
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

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', alignItems: 'center' }}>
          {/* Keyword Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input
              type="text"
              placeholder="Search by doctor, specialization, license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* Specialization Filter */}
          <div>
            <select
              value={selectedSpec}
              onChange={(e) => setSelectedSpec(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Specializations</option>
              {specializations.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_LEAVE">ON LEAVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="RETIRED">RETIRED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Doctor</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>License / Ref</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Consultation Fee</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shifts / Room</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
                    <div>Loading doctor records...</div>
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Stethoscope size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No doctors match the selected criteria.</p>
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}>
                    {/* Doctor Info */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0284c7 0%, #075985 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}>
                          {doc.firstName?.[0]}{doc.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                            Dr. {doc.firstName} {doc.lastName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {doc.specialization} • {doc.qualification}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {doc.departmentName}
                      </span>
                    </td>

                    {/* License Number & ID */}
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>{doc.licenseNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.doctorNumber}</div>
                    </td>

                    {/* Fee */}
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      LKR {Number(doc.consultationFee).toLocaleString()}
                    </td>

                    {/* Shifts & Room */}
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.825rem' }}>
                      <div>
                        <strong>{doc.schedules?.length || 0}</strong> weekly shift(s)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {doc.roomNumber || 'No room assigned'}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <DoctorStatusBadge status={doc.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleOpenDetails(doc)}
                          className="btn btn-icon"
                          title="View Profile"
                          style={{ border: '1px solid var(--border)', background: 'transparent' }}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => handleOpenSchedules(doc)}
                          className="btn btn-icon"
                          title="Manage Schedules"
                          style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--primary)' }}
                        >
                          <Calendar size={15} />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleOpenEditDoctor(doc)}
                            className="btn btn-icon"
                            title="Edit Details"
                            style={{ border: '1px solid var(--border)', background: 'transparent' }}
                          >
                            <Edit2 size={15} />
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

        {/* Pagination Bar */}
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
              Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} doctors
            </span>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                disabled={currentPage === 0}
                onClick={() => fetchDoctors(currentPage - 1)}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => fetchDoctors(currentPage + 1)}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DoctorModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        onSuccess={(msg) => {
          setFeedback({ error: '', success: msg })
          fetchDoctors(currentPage)
          fetchStats()
        }}
        doctor={selectedDoctor}
      />

      <DoctorScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        doctor={selectedDoctor}
      />

      <DepartmentModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onUpdated={() => {
          fetchMetadata()
          fetchStats()
          fetchDoctors(currentPage)
        }}
      />

      <DoctorDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        doctor={selectedDoctor}
        onManageSchedule={(doc) => handleOpenSchedules(doc)}
        onEdit={(doc) => handleOpenEditDoctor(doc)}
      />
    </div>
  )
}
