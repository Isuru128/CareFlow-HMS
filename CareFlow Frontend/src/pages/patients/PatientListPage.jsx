import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { patientApi } from '../../features/patients/api/patientApi'
import PatientModal from '../../features/patients/components/PatientModal'
import PatientStatusBadge from '../../features/patients/components/PatientStatusBadge'
import { useAuth } from '../../context/AuthContext'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Paperclip,
  Activity,
  HeartPulse,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  Phone,
  ShieldCheck,
  UserX
} from 'lucide-react'

export default function PatientListPage() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [patients, setPatients] = useState([])
  const [stats, setStats] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [genderFilter, setGenderFilter] = useState('ALL')

  // Feedback & Modals
  const [feedback, setFeedback] = useState({ error: '', success: '' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  // Check roles for permissions
  const canRegisterOrEdit = user?.roles?.some((r) =>
    ['ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_NURSE', 'ROLE_DOCTOR'].includes(r)
  )

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchStats = async () => {
    try {
      const data = await patientApi.getPatientStats()
      setStats(data)
    } catch (err) {
      // Non-critical, ignore silent fail
    }
  }

  const fetchPatients = async (page = 0) => {
    setLoading(true)
    setFeedback({ error: '', success: '' })
    try {
      const data = await patientApi.getPatients({
        query: debouncedSearch,
        status: statusFilter,
        gender: genderFilter,
        page,
        size: pageSize
      })
      setPatients(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
      setCurrentPage(data.number || 0)
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Failed to load patients from server.',
        success: ''
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchPatients(0)
  }, [debouncedSearch, statusFilter, genderFilter])

  const handleCreateOpen = () => {
    setSelectedPatient(null)
    setIsModalOpen(true)
  }

  const handleEditOpen = (p, e) => {
    e.stopPropagation()
    setSelectedPatient(p)
    setIsModalOpen(true)
  }

  const handleStatusChange = async (patientId, newStatus, e) => {
    e.stopPropagation()
    try {
      await patientApi.updatePatientStatus(patientId, newStatus)
      setFeedback({ error: '', success: `Patient status updated to ${newStatus}.` })
      fetchPatients(currentPage)
      fetchStats()
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Failed to update patient status.',
        success: ''
      })
    }
  }

  const handleDeletePatient = async (patient, e) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to permanently delete patient "${patient.firstName} ${patient.lastName}" (${patient.patientNumber})? This will also remove all medical records and documents.`)) {
      return
    }

    try {
      await patientApi.deletePatient(patient.id)
      setFeedback({ error: '', success: `Patient ${patient.patientNumber} deleted successfully.` })
      fetchPatients(currentPage)
      fetchStats()
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Failed to delete patient.',
        success: ''
      })
    }
  }

  const calculateAge = (dobString) => {
    if (!dobString) return '—'
    const dob = new Date(dobString)
    const diffMs = Date.now() - dob.getTime()
    const ageDt = new Date(diffMs)
    return Math.abs(ageDt.getUTCFullYear() - 1970) + ' yrs'
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 700 }}>Patient Management</h1>
            <span style={{ fontSize: '0.8rem', background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              {totalElements} Total
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Search registered patients, review electronic medical records, and manage baseline demographics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { fetchPatients(currentPage); fetchStats(); }}
            title="Refresh patient list"
          >
            <RefreshCw size={15} /> Refresh
          </button>

          {canRegisterOrEdit && (
            <button className="btn btn-primary" onClick={handleCreateOpen}>
              <UserPlus size={18} /> Register Patient
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {feedback.error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{feedback.error}</span>
        </div>
      )}
      {feedback.success && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{feedback.success}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Patients</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats?.totalPatients ?? '—'}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', color: 'var(--success)' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Patients</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{stats?.activePatients ?? '—'}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: '#fef3c7', color: '#b45309' }}>
            <UserX size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Inactive / Discharged</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats?.inactivePatients ?? '—'}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: '#e0e7ff', color: '#4338ca' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Registered Today</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4338ca' }}>{stats?.newPatientsToday ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-light)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search by Patient ID, Name, Contact, NIC, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ width: '160px' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DECEASED">Deceased</option>
          </select>
        </div>

        <div style={{ width: '150px' }}>
          <select
            className="form-select"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="ALL">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} color="var(--primary)" />
            <p style={{ fontWeight: 500 }}>Querying patient database records...</p>
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>No patients found</p>
            <p style={{ fontSize: '0.85rem' }}>Try refining your search query or registering a new patient record.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Patient Name & Demographics</th>
                <th>Blood Group</th>
                <th>Contact & Identification</th>
                <th>Status</th>
                <th>Medical Data</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <td>
                    <span style={{
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      color: 'var(--primary)',
                      background: 'var(--primary-subtle)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--primary-light)'
                    }}>
                      {patient.patientNumber}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {patient.gender} • {calculateAge(patient.dateOfBirth)} ({patient.dateOfBirth})
                    </div>
                  </td>

                  <td>
                    {patient.bloodGroup ? (
                      <span className="badge badge-blood">{patient.bloodGroup}</span>
                    ) : (
                      <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{patient.contactNumber}</span>
                    </div>
                    {patient.nicOrPassport && (
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        NIC: {patient.nicOrPassport}
                      </div>
                    )}
                  </td>

                  <td>
                    <PatientStatusBadge status={patient.status} />
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span
                        title="Recorded medical diagnoses"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: '#f1f5f9',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <FileText size={12} color="var(--primary)" />
                        {patient.totalMedicalHistories} {patient.totalMedicalHistories === 1 ? 'Record' : 'Records'}
                      </span>

                      <span
                        title="Attached files and scans"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: '#f1f5f9',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <Paperclip size={12} color="#059669" />
                        {patient.totalDocuments} {patient.totalDocuments === 1 ? 'Doc' : 'Docs'}
                      </span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/patients/${patient.id}`}
                        className="btn btn-secondary btn-sm"
                        title="View electronic medical history & documents"
                      >
                        <Eye size={14} />
                      </Link>

                      {canRegisterOrEdit && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => handleEditOpen(patient, e)}
                          title="Edit patient details"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}

                      {canRegisterOrEdit && (
                        <select
                          className="form-select"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '30px', width: 'auto' }}
                          value={patient.status}
                          onChange={(e) => handleStatusChange(patient.id, e.target.value, e)}
                          title="Change status"
                        >
                          <option value="ACTIVE">Set Active</option>
                          <option value="INACTIVE">Set Inactive</option>
                          <option value="DECEASED">Set Deceased</option>
                        </select>
                      )}

                      {isAdmin && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={(e) => handleDeletePatient(patient, e)}
                          title="Delete patient record"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing page {currentPage + 1} of {totalPages} ({totalElements} total patients)
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 0}
              onClick={() => fetchPatients(currentPage - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => fetchPatients(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal for Register / Edit Patient */}
      <PatientModal
        isOpen={isModalOpen}
        patientToEdit={selectedPatient}
        onClose={() => setIsModalOpen(false)}
        onPatientSaved={() => {
          fetchPatients(currentPage)
          fetchStats()
        }}
      />
    </div>
  )
}
