import { useState, useEffect } from 'react'
import { emrApi } from '../../features/emr/api/emrApi'
import { doctorApi } from '../../features/doctors/api/doctorApi'
import { patientApi } from '../../features/patients/api/patientApi'
import EmrStatusBadge from '../../features/emr/components/EmrStatusBadge'
import CreateMedicalRecordModal from '../../features/emr/components/CreateMedicalRecordModal'
import MedicalRecordDetailModal from '../../features/emr/components/MedicalRecordDetailModal'
import DiagnosisModal from '../../features/emr/components/DiagnosisModal'
import PrescriptionModal from '../../features/emr/components/PrescriptionModal'
import TreatmentModal from '../../features/emr/components/TreatmentModal'
import MedicalReportModal from '../../features/emr/components/MedicalReportModal'
import PatientEmrSummaryModal from '../../features/emr/components/PatientEmrSummaryModal'
import { useAuth } from '../../context/AuthContext'
import {
  FileText,
  Activity,
  Pill,
  Sparkles,
  ClipboardList,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  User,
  Stethoscope,
  HeartPulse,
  AlertCircle,
  Loader2,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function EmrDashboardPage() {
  const { user } = useAuth()
  const isDoctorOrNurse = user?.roles?.some((r) => ['ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE'].includes(r))
  const isPharmacist = user?.roles?.some((r) => ['ROLE_ADMIN', 'ROLE_PHARMACIST', 'ROLE_DOCTOR'].includes(r))

  // Tab: 'records' | 'diagnoses' | 'prescriptions' | 'treatments' | 'reports'
  const [activeTab, setActiveTab] = useState('records')

  // Stats
  const [stats, setStats] = useState(null)

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [patientFilter, setPatientFilter] = useState('ALL')
  const [doctorFilter, setDoctorFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [reportTypeFilter, setReportTypeFilter] = useState('ALL')

  // Metadata
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])

  // Paged Data
  const [records, setRecords] = useState([])
  const [diagnoses, setDiagnoses] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [treatments, setTreatments] = useState([])
  const [reports, setReports] = useState([])

  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState({ error: '', success: '' })

  // Modals
  const [isRecordCreateOpen, setIsRecordCreateOpen] = useState(false)
  const [isRecordDetailOpen, setIsRecordDetailOpen] = useState(false)
  const [selectedRecordId, setSelectedRecordId] = useState(null)

  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false)
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null)

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)

  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState(null)

  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
  const [selectedSummaryPatientId, setSelectedSummaryPatientId] = useState(null)

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
    setCurrentPage(0)
  }, [activeTab, debouncedSearch, patientFilter, doctorFilter, statusFilter, categoryFilter, reportTypeFilter])

  useEffect(() => {
    loadTabData(currentPage)
  }, [activeTab, currentPage, debouncedSearch, patientFilter, doctorFilter, statusFilter, categoryFilter, reportTypeFilter])

  const fetchStats = async () => {
    try {
      const data = await emrApi.getEmrStats()
      setStats(data)
    } catch (err) {
      // stats error non-critical
    }
  }

  const fetchMetadata = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        patientApi.getPatients({ size: 100 }),
        doctorApi.getActiveDoctorsSummary()
      ])
      setPatients(patRes?.content || [])
      setDoctors(docRes || [])
    } catch (err) {
      console.error(err)
    }
  }

  const loadTabData = async (page = 0) => {
    try {
      setLoading(true)
      if (activeTab === 'records') {
        const res = await emrApi.getMedicalRecords({
          query: debouncedSearch,
          patientId: patientFilter,
          doctorId: doctorFilter,
          status: statusFilter,
          page,
          size: pageSize
        })
        setRecords(res.content || [])
        setTotalPages(res.totalPages || 0)
        setTotalElements(res.totalElements || 0)
      } else if (activeTab === 'diagnoses') {
        const res = await emrApi.getDiagnoses({
          query: debouncedSearch,
          patientId: patientFilter,
          status: statusFilter,
          page,
          size: pageSize
        })
        setDiagnoses(res.content || [])
        setTotalPages(res.totalPages || 0)
        setTotalElements(res.totalElements || 0)
      } else if (activeTab === 'prescriptions') {
        const res = await emrApi.getPrescriptions({
          query: debouncedSearch,
          patientId: patientFilter,
          doctorId: doctorFilter,
          status: statusFilter,
          page,
          size: pageSize
        })
        setPrescriptions(res.content || [])
        setTotalPages(res.totalPages || 0)
        setTotalElements(res.totalElements || 0)
      } else if (activeTab === 'treatments') {
        const res = await emrApi.getTreatments({
          query: debouncedSearch,
          patientId: patientFilter,
          category: categoryFilter,
          status: statusFilter,
          page,
          size: pageSize
        })
        setTreatments(res.content || [])
        setTotalPages(res.totalPages || 0)
        setTotalElements(res.totalElements || 0)
      } else if (activeTab === 'reports') {
        const res = await emrApi.getReports({
          query: debouncedSearch,
          patientId: patientFilter,
          doctorId: doctorFilter,
          reportType: reportTypeFilter,
          status: statusFilter,
          page,
          size: pageSize
        })
        setReports(res.content || [])
        setTotalPages(res.totalPages || 0)
        setTotalElements(res.totalElements || 0)
      }
    } catch (err) {
      setFeedback({ error: 'Failed to load records.', success: '' })
    } finally {
      setLoading(false)
    }
  }

  const handleResolveDiagnosis = async (id) => {
    try {
      await emrApi.resolveDiagnosis(id)
      setFeedback({ error: '', success: 'Diagnosis marked as resolved.' })
      loadTabData(currentPage)
      fetchStats()
    } catch (err) {
      setFeedback({ error: 'Failed to resolve diagnosis.', success: '' })
    }
  }

  const handleDispensePrescription = async (id) => {
    try {
      await emrApi.dispensePrescription(id)
      setFeedback({ error: '', success: 'Prescription marked as dispensed.' })
      loadTabData(currentPage)
      fetchStats()
    } catch (err) {
      setFeedback({ error: 'Failed to dispense prescription.', success: '' })
    }
  }

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this encounter record?')) return
    try {
      await emrApi.deleteMedicalRecord(id)
      setFeedback({ error: '', success: 'Medical record deleted.' })
      loadTabData(currentPage)
      fetchStats()
    } catch (err) {
      setFeedback({ error: 'Failed to delete record.', success: '' })
    }
  }

  const showPatientSummary = (patientId) => {
    setSelectedSummaryPatientId(patientId)
    setIsSummaryModalOpen(true)
  }

  return (
    <div className="page-wrapper" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, #0b1329 0%, #0f172a 100%)',
          padding: '1.75rem 2rem',
          borderRadius: 'var(--radius-lg)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
            }}
          >
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Electronic Medical Records (EMR)
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Centralized clinical encounters, diagnoses, prescriptions, treatment logs, and medical reports
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {isDoctorOrNurse && (
            <button
              onClick={() => setIsRecordCreateOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> New Encounter
            </button>
          )}

          {isDoctorOrNurse && (
            <button
              onClick={() => {
                setSelectedDiagnosis(null)
                setIsDiagnosisModalOpen(true)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Activity size={15} /> Add Diagnosis
            </button>
          )}

          {isDoctorOrNurse && (
            <button
              onClick={() => setIsPrescriptionModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Pill size={15} /> Issue Prescription
            </button>
          )}

          <button
            onClick={() => {
              loadTabData(currentPage)
              fetchStats()
            }}
            style={{
              padding: '0.65rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              cursor: 'pointer'
            }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Encounters</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
              {stats.totalRecords}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              <strong>{stats.finalizedRecords}</strong> finalized | <strong>{stats.draftRecords}</strong> draft
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Active Diagnoses</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
              {stats.activeDiagnoses}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Active and chronic conditions under care
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Prescriptions</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pill size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
              {stats.activePrescriptions}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              <strong>{stats.dispensedPrescriptions}</strong> dispensed at pharmacy
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Therapies & Reports</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
              {stats.activeTreatments + stats.totalReports}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              <strong>{stats.activeTreatments}</strong> treatments | <strong>{stats.totalReports}</strong> medical reports
            </div>
          </div>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback.error && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <AlertCircle size={16} />
          <span>{feedback.error}</span>
        </div>
      )}
      {feedback.success && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--success-bg)', color: 'var(--success-hover)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <Check size={16} />
          <span>{feedback.success}</span>
        </div>
      )}

      {/* Tab Navigation & Toolbar */}
      <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Tab Headers */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('records')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.9rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              background: activeTab === 'records' ? '#ffffff' : 'transparent',
              color: activeTab === 'records' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'records' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <FileText size={17} /> Medical Encounters
          </button>

          <button
            onClick={() => setActiveTab('diagnoses')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.9rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              background: activeTab === 'diagnoses' ? '#ffffff' : 'transparent',
              color: activeTab === 'diagnoses' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'diagnoses' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Activity size={17} /> Patient Diagnoses
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.9rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              background: activeTab === 'prescriptions' ? '#ffffff' : 'transparent',
              color: activeTab === 'prescriptions' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'prescriptions' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Pill size={17} /> Prescriptions
          </button>

          <button
            onClick={() => setActiveTab('treatments')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.9rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              background: activeTab === 'treatments' ? '#ffffff' : 'transparent',
              color: activeTab === 'treatments' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'treatments' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Sparkles size={17} /> Treatment History
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.9rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              background: activeTab === 'reports' ? '#ffffff' : 'transparent',
              color: activeTab === 'reports' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'reports' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <ClipboardList size={17} /> Medical Reports
          </button>
        </div>

        {/* Filter Controls Row */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input
              type="text"
              placeholder={
                activeTab === 'records'
                  ? 'Search by record #, patient, doctor, symptoms...'
                  : activeTab === 'diagnoses'
                  ? 'Search diagnosis name, ICD-10, patient...'
                  : activeTab === 'prescriptions'
                  ? 'Search Rx #, patient, doctor...'
                  : activeTab === 'treatments'
                  ? 'Search procedure, therapy name, patient...'
                  : 'Search report title, number, patient...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Patient Filter */}
          <select
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            style={{ padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Patients</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.patientNumber} - {p.firstName} {p.lastName}
              </option>
            ))}
          </select>

          {/* Doctor Filter (Applicable to records, prescriptions, reports) */}
          {['records', 'prescriptions', 'reports'].includes(activeTab) && (
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              style={{ padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.firstName} {d.lastName}
                </option>
              ))}
            </select>
          )}

          {/* Tab Specific Action Buttons */}
          <div style={{ marginLeft: 'auto' }}>
            {activeTab === 'treatments' && isDoctorOrNurse && (
              <button
                onClick={() => {
                  setSelectedTreatment(null)
                  setIsTreatmentModalOpen(true)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Add Treatment
              </button>
            )}

            {activeTab === 'reports' && isDoctorOrNurse && (
              <button
                onClick={() => {
                  setSelectedReport(null)
                  setIsReportModalOpen(true)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Author Report
              </button>
            )}
          </div>
        </div>

        {/* Tab Content Display */}
        <div style={{ padding: '1rem', minHeight: '360px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
              <Loader2 size={36} className="animate-spin" color="var(--primary)" />
            </div>
          ) : (
            <>
              {/* TAB 1: MEDICAL RECORDS */}
              {activeTab === 'records' && (
                <div>
                  {records.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <FileText size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>No medical encounters found matching criteria.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Record #</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Attending Doctor</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Chief Complaint</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Vitals (BP / HR / BMI)</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Encounter Date</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((r) => (
                            <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.recordNumber}</span>
                                {r.appointmentNumber && (
                                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Apt #{r.appointmentNumber}</div>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div
                                  onClick={() => showPatientSummary(r.patientId)}
                                  style={{ fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', textDecoration: 'underline' }}
                                  title="View Full Patient EMR Chart"
                                >
                                  {r.patientName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {r.patientNumber} | {r.patientGender} {r.patientBloodGroup ? `(${r.patientBloodGroup})` : ''}
                                </div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 600 }}>{r.doctorName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.doctorSpecialization}</div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', maxWidth: '240px' }}>
                                <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {r.chiefComplaint}
                                </div>
                                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                  {r.diagnosisCount} diag | {r.prescriptionCount} rx | {r.treatmentCount} treat
                                </div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{ fontWeight: 600 }}>{r.bloodPressure || '--'}</span>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {r.heartRateBpm ? `${r.heartRateBpm} bpm` : '--'} | BMI: {r.bmi || '--'}
                                </div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                {new Date(r.visitDate).toLocaleDateString()}
                                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                  {new Date(r.visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <EmrStatusBadge status={r.status} />
                              </td>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                  <button
                                    onClick={() => {
                                      setSelectedRecordId(r.id)
                                      setIsRecordDetailOpen(true)
                                    }}
                                    style={{
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: 'var(--radius-sm)',
                                      background: 'var(--primary-subtle)',
                                      color: 'var(--primary)',
                                      border: 'none',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      cursor: 'pointer'
                                    }}
                                    title="View Full Consultation Record"
                                  >
                                    <Eye size={14} /> View
                                  </button>

                                  {isDoctorOrNurse && (
                                    <button
                                      onClick={() => handleDeleteRecord(r.id)}
                                      style={{
                                        padding: '0.35rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'transparent',
                                        color: 'var(--danger)',
                                        border: 'none',
                                        cursor: 'pointer'
                                      }}
                                      title="Delete Record"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PATIENT DIAGNOSES */}
              {activeTab === 'diagnoses' && (
                <div>
                  {diagnoses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <Activity size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>No diagnoses found.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Condition / Diagnosis</th>
                            <th style={{ padding: '0.75rem 1rem' }}>ICD-10</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Diagnosed By</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Type & Severity</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Diagnosed Date</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diagnoses.map((d) => (
                            <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 700 }}>{d.diagnosisName}</div>
                                {d.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.notes}</div>}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{ padding: '0.2rem 0.5rem', background: '#e2e8f0', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                                  {d.icd10Code || 'N/A'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div
                                  onClick={() => showPatientSummary(d.patientId)}
                                  style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  {d.patientName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.patientNumber}</div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>{d.doctorName}</td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  <EmrStatusBadge status={d.diagnosisType} />
                                  <EmrStatusBadge status={d.severity} />
                                </div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>{d.diagnosedDate}</td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <EmrStatusBadge status={d.status} />
                              </td>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                  {d.status === 'ACTIVE' && isDoctorOrNurse && (
                                    <button
                                      onClick={() => handleResolveDiagnosis(d.id)}
                                      style={{
                                        padding: '0.35rem 0.65rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'var(--success-bg)',
                                        color: 'var(--success-hover)',
                                        border: '1px solid var(--success-light)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                      }}
                                      title="Mark Condition Resolved"
                                    >
                                      Resolve
                                    </button>
                                  )}
                                  {isDoctorOrNurse && (
                                    <button
                                      onClick={() => {
                                        setSelectedDiagnosis(d)
                                        setIsDiagnosisModalOpen(true)
                                      }}
                                      style={{
                                        padding: '0.35rem 0.65rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'var(--surface-alt)',
                                        border: '1px solid var(--border)',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PRESCRIPTIONS */}
              {activeTab === 'prescriptions' && (
                <div>
                  {prescriptions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <Pill size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>No prescriptions found.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Rx #</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Prescriber</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Medications Ordered</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Issued Date</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescriptions.map((p) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.prescriptionNumber}</span>
                                {p.recordNumber && (
                                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>From {p.recordNumber}</div>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div
                                  onClick={() => showPatientSummary(p.patientId)}
                                  style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  {p.patientName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.patientNumber}</div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>{p.doctorName}</td>
                              <td style={{ padding: '0.75rem 1rem', maxWidth: '320px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  {p.items && p.items.map((it) => (
                                    <div key={it.id} style={{ fontSize: '0.8rem' }}>
                                      • <strong>{it.medicationName}</strong> ({it.dosage}) - {it.frequency}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                {p.issueDate}
                                {p.validUntil && (
                                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Exp: {p.validUntil}</div>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <EmrStatusBadge status={p.status} />
                              </td>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                  {p.status === 'ACTIVE' && isPharmacist && (
                                    <button
                                      onClick={() => handleDispensePrescription(p.id)}
                                      style={{
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'var(--success)',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Dispense
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TREATMENT HISTORY */}
              {activeTab === 'treatments' && (
                <div>
                  {treatments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <Sparkles size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>No treatment history records found.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Treatment / Procedure</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Clinician</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Date Range</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Outcome</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {treatments.map((t) => (
                            <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 700 }}>{t.treatmentName}</div>
                                {t.procedureNotes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.procedureNotes}</div>}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{ padding: '0.2rem 0.5rem', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  {t.category ? t.category.replace(/_/g, ' ') : '--'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div
                                  onClick={() => showPatientSummary(t.patientId)}
                                  style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  {t.patientName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.patientNumber}</div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>{t.doctorName}</td>
                              <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                {t.startDate} {t.endDate ? `to ${t.endDate}` : ''}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <EmrStatusBadge status={t.status} />
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                {t.outcome ? <EmrStatusBadge status={t.outcome} /> : '--'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                {isDoctorOrNurse && (
                                  <button
                                    onClick={() => {
                                      setSelectedTreatment(t)
                                      setIsTreatmentModalOpen(true)
                                    }}
                                    style={{
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: 'var(--radius-sm)',
                                      background: 'var(--surface-alt)',
                                      border: '1px solid var(--border)',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: MEDICAL REPORTS */}
              {activeTab === 'reports' && (
                <div>
                  {reports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>No clinical reports found.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Report #</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Title & Type</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Authoring Doctor</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Findings / Summary</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.map((rep) => (
                            <tr key={rep.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{rep.reportNumber}</span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 700 }}>{rep.reportTitle}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {rep.reportType ? rep.reportType.replace(/_/g, ' ') : '--'}
                                </div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div
                                  onClick={() => showPatientSummary(rep.patientId)}
                                  style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  {rep.patientName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rep.patientNumber}</div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>{rep.doctorName}</td>
                              <td style={{ padding: '0.75rem 1rem' }}>{rep.reportDate}</td>
                              <td style={{ padding: '0.75rem 1rem', maxWidth: '280px' }}>
                                <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {rep.clinicalFindings}
                                </div>
                                {rep.summary && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rep.summary}</div>}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <EmrStatusBadge status={rep.status} />
                              </td>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                {isDoctorOrNurse && (
                                  <button
                                    onClick={() => {
                                      setSelectedReport(rep)
                                      setIsReportModalOpen(true)
                                    }}
                                    style={{
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: 'var(--radius-sm)',
                                      background: 'var(--surface-alt)',
                                      border: '1px solid var(--border)',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', padding: '0.5rem 0.5rem', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing Page {currentPage + 1} of {totalPages} ({totalElements} total entries)
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: currentPage === 0 ? 'var(--surface-alt)' : '#ffffff',
                    cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: currentPage >= totalPages - 1 ? 'var(--surface-alt)' : '#ffffff',
                    cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <CreateMedicalRecordModal
        isOpen={isRecordCreateOpen}
        onClose={() => setIsRecordCreateOpen(false)}
        onCreated={() => {
          loadTabData(0)
          fetchStats()
        }}
      />

      <MedicalRecordDetailModal
        isOpen={isRecordDetailOpen}
        recordId={selectedRecordId}
        onClose={() => {
          setIsRecordDetailOpen(false)
          setSelectedRecordId(null)
        }}
        onUpdated={() => {
          loadTabData(currentPage)
          fetchStats()
        }}
      />

      <DiagnosisModal
        isOpen={isDiagnosisModalOpen}
        diagnosis={selectedDiagnosis}
        onClose={() => {
          setIsDiagnosisModalOpen(false)
          setSelectedDiagnosis(null)
        }}
        onSaved={() => {
          loadTabData(0)
          fetchStats()
        }}
      />

      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        onSaved={() => {
          loadTabData(0)
          fetchStats()
        }}
      />

      <TreatmentModal
        isOpen={isTreatmentModalOpen}
        treatment={selectedTreatment}
        onClose={() => {
          setIsTreatmentModalOpen(false)
          setSelectedTreatment(null)
        }}
        onSaved={() => {
          loadTabData(0)
          fetchStats()
        }}
      />

      <MedicalReportModal
        isOpen={isReportModalOpen}
        report={selectedReport}
        onClose={() => {
          setIsReportModalOpen(false)
          setSelectedReport(null)
        }}
        onSaved={() => {
          loadTabData(0)
          fetchStats()
        }}
      />

      <PatientEmrSummaryModal
        isOpen={isSummaryModalOpen}
        patientId={selectedSummaryPatientId}
        onClose={() => {
          setIsSummaryModalOpen(false)
          setSelectedSummaryPatientId(null)
        }}
        onOpenRecordDetail={(recId) => {
          setIsSummaryModalOpen(false)
          setSelectedRecordId(recId)
          setIsRecordDetailOpen(true)
        }}
      />
    </div>
  )
}
