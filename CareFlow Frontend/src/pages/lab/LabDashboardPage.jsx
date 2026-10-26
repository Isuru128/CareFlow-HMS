import { useState, useEffect, useCallback } from 'react'
import { labApi } from '../../features/lab/api/labApi'
import {
  PriorityBadge,
  RequestStatusBadge,
  SampleStatusBadge,
  ReportStatusBadge
} from '../../features/lab/components/LabStatusBadge'
import CreateLabRequestModal from '../../features/lab/components/CreateLabRequestModal'
import SampleCollectionModal from '../../features/lab/components/SampleCollectionModal'
import ResultEntryModal from '../../features/lab/components/ResultEntryModal'
import LabReportModal from '../../features/lab/components/LabReportModal'
import LabCatalogModal from '../../features/lab/components/LabCatalogModal'

import {
  FlaskConical,
  TestTube2,
  ClipboardCheck,
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Printer,
  Ban,
  Activity
} from 'lucide-react'

export default function LabDashboardPage() {
  // Active Tab
  const [activeTab, setActiveTab] = useState('requests') // 'requests' | 'samples' | 'results' | 'reports' | 'catalog'

  // Metric Stats
  const [stats, setStats] = useState({
    totalRequests: 0,
    requestedCount: 0,
    sampleCollectedCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    urgentStatCount: 0,
    totalTestsCatalog: 0
  })

  // Table Data States
  const [requests, setRequests] = useState([])
  const [samples, setSamples] = useState([])
  const [reports, setReports] = useState([])
  const [catalog, setCatalog] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  // Pagination
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [collectionModalState, setCollectionModalState] = useState({ isOpen: false, request: null })
  const [resultModalState, setResultModalState] = useState({ isOpen: false, requestId: null })
  const [reportModalState, setReportModalState] = useState({ isOpen: false, requestId: null, reportId: null })
  const [catalogModalState, setCatalogModalState] = useState({ isOpen: false, editingTest: null })

  // Load summary statistics
  const loadStats = async () => {
    try {
      const data = await labApi.getSummaryStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load lab statistics:', err)
    }
  }

  // Load active tab data
  const loadTabData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeTab === 'requests') {
        const data = await labApi.getRequests({
          query: searchQuery,
          status: statusFilter,
          priority: priorityFilter,
          page,
          size: pageSize
        })
        setRequests(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      } else if (activeTab === 'samples') {
        const data = await labApi.getSamples({
          query: searchQuery,
          status: statusFilter,
          page,
          size: pageSize
        })
        setSamples(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      } else if (activeTab === 'results') {
        // Pending result entry = requests with status SAMPLE_COLLECTED or IN_PROGRESS
        const data = await labApi.getRequests({
          query: searchQuery,
          status: statusFilter !== 'ALL' ? statusFilter : 'SAMPLE_COLLECTED',
          priority: priorityFilter,
          page,
          size: pageSize
        })
        setRequests(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      } else if (activeTab === 'reports') {
        const data = await labApi.getReports({
          query: searchQuery,
          page,
          size: pageSize
        })
        setReports(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      } else if (activeTab === 'catalog') {
        const data = await labApi.getTests({
          query: searchQuery,
          category: categoryFilter,
          page,
          size: 20
        })
        setCatalog(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      }
    } catch (err) {
      console.error('Failed to load laboratory data:', err)
      setError('Failed to fetch data for the selected laboratory view.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchQuery, statusFilter, priorityFilter, categoryFilter, page, pageSize])

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    setPage(0)
  }, [activeTab, searchQuery, statusFilter, priorityFilter, categoryFilter])

  useEffect(() => {
    loadTabData()
  }, [loadTabData])

  const handleCancelRequest = async (req) => {
    if (window.confirm(`Are you sure you want to cancel test request ${req.requestNumber} for ${req.patientName}?`)) {
      try {
        await labApi.cancelRequest(req.id, 'Cancelled by staff from dashboard')
        loadTabData()
        loadStats()
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to cancel request')
      }
    }
  }

  const handleSampleStatusQuickAdvance = async (sampleId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'COLLECTED' ? 'RECEIVED_IN_LAB' : 'PROCESSING'
      await labApi.updateSampleStatus(sampleId, { status: nextStatus })
      loadTabData()
      loadStats()
    } catch (err) {
      alert('Failed to update sample status')
    }
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)'
          }}>
            <FlaskConical size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--secondary)', margin: 0, letterSpacing: '-0.01em' }}>
              Laboratory Management
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Diagnostic test orders, specimen tracking, result entry & clinical report generation
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => { loadTabData(); loadStats() }}
            className="btn btn-secondary"
            title="Refresh laboratory records"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600 }}
          >
            <Plus size={16} />
            <span>New Test Request</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Orders */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Requests
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--secondary)' }}>
              {stats.totalRequests}
            </div>
          </div>
        </div>

        {/* Pending Specimen Collection */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
            <TestTube2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Pending Collection
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d4ed8' }}>
              {stats.requestedCount}
            </div>
          </div>
        </div>

        {/* In Progress / In Lab */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#fffbeb', color: '#b45309' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Processing / In Lab
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>
              {stats.sampleCollectedCount + stats.inProgressCount}
            </div>
          </div>
        </div>

        {/* Completed Investigations */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#047857' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Completed & Reported
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857' }}>
              {stats.completedCount}
            </div>
          </div>
        </div>

        {/* STAT & Urgent Alert */}
        <div style={{
          backgroundColor: stats.urgentStatCount > 0 ? '#fff1f2' : '#ffffff',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          border: stats.urgentStatCount > 0 ? '1px solid #fecdd3' : '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: stats.urgentStatCount > 0 ? '#fee2e2' : '#f1f5f9', color: stats.urgentStatCount > 0 ? '#e11d48' : '#64748b' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: stats.urgentStatCount > 0 ? '#be123c' : 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active STAT / Urgent
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stats.urgentStatCount > 0 ? '#e11d48' : 'var(--secondary)' }}>
              {stats.urgentStatCount}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          backgroundColor: '#f8fafc',
          padding: '0 1rem',
          overflowX: 'auto',
          gap: '0.5rem'
        }}>
          {[
            { id: 'requests', label: 'Test Requests', icon: FlaskConical, badge: stats.totalRequests },
            { id: 'samples', label: 'Sample Collection Queue', icon: TestTube2, badge: stats.requestedCount },
            { id: 'results', label: 'Result Entry Queue', icon: ClipboardCheck, badge: stats.sampleCollectedCount + stats.inProgressCount },
            { id: 'reports', label: 'Diagnostic Reports', icon: FileText, badge: stats.completedCount },
            { id: 'catalog', label: 'Test Catalog', icon: Layers, badge: stats.totalTestsCatalog }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.9rem 1.1rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  border: 'none',
                  borderBottom: isActive ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? 'var(--primary-subtle)' : '#e2e8f0',
                    color: isActive ? 'var(--primary-dark)' : 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Filter Toolbar */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px', maxWidth: '380px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={activeTab === 'catalog' ? 'Search test name or code...' : 'Search by patient, ID, or order #...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#f8fafc'
                }}
              />
            </div>

            {/* Status Filter (if applicable) */}
            {activeTab !== 'catalog' && activeTab !== 'reports' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--secondary)'
                }}
              >
                <option value="ALL">All Statuses</option>
                {activeTab === 'requests' && (
                  <>
                    <option value="REQUESTED">Requested</option>
                    <option value="SAMPLE_COLLECTED">Sample Collected</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </>
                )}
                {activeTab === 'samples' && (
                  <>
                    <option value="COLLECTED">Collected</option>
                    <option value="RECEIVED_IN_LAB">Received in Lab</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="REJECTED">Rejected</option>
                  </>
                )}
              </select>
            )}

            {/* Priority Filter */}
            {(activeTab === 'requests' || activeTab === 'results') && (
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--secondary)'
                }}
              >
                <option value="ALL">All Priorities</option>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT (Immediate)</option>
              </select>
            )}

            {/* Category Filter for Catalog */}
            {activeTab === 'catalog' && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--secondary)'
                }}
              >
                <option value="ALL">All Disciplines</option>
                <option value="HEMATOLOGY">Hematology</option>
                <option value="BIOCHEMISTRY">Biochemistry</option>
                <option value="IMMUNOLOGY">Immunology</option>
                <option value="MICROBIOLOGY">Microbiology</option>
                <option value="PATHOLOGY">Pathology</option>
                <option value="URINALYSIS">Urinalysis</option>
                <option value="RADIOLOGY">Radiology</option>
              </select>
            )}
          </div>

          {activeTab === 'catalog' && (
            <button
              type="button"
              onClick={() => setCatalogModalState({ isOpen: true, editingTest: null })}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
            >
              <Plus size={15} /> Add Test to Catalog
            </button>
          )}
        </div>

        {/* Tab Views Content */}
        <div style={{ overflowX: 'auto', minHeight: '340px' }}>
          {error && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading laboratory data...
            </div>
          ) : (
            <>
              {/* TAB 1: TEST REQUESTS TABLE */}
              {activeTab === 'requests' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Order #</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Patient Demographics</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Requesting Doctor</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Tests Included</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Priority</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Requested Date</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No test requests found matching the current filters.
                        </td>
                      </tr>
                    ) : (
                      requests.map(req => (
                        <tr key={req.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.1s' }} className="table-row-hover">
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                              {req.requestNumber}
                            </span>
                          </td>

                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                              {req.patientName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {req.patientNumber} {req.patientAge ? `• ${req.patientAge}y` : ''} {req.patientGender ? `• ${req.patientGender}` : ''}
                            </div>
                          </td>

                          <td style={{ padding: '0.85rem 1rem', color: 'var(--secondary)' }}>
                            {req.doctorName}
                          </td>

                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--secondary)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {req.testNames?.join(', ') || `${req.itemCount} Test(s)`}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {req.itemCount} Test item(s)
                            </span>
                          </td>

                          <td style={{ padding: '0.85rem 1rem' }}>
                            <PriorityBadge priority={req.priority} />
                          </td>

                          <td style={{ padding: '0.85rem 1rem' }}>
                            <RequestStatusBadge status={req.status} />
                          </td>

                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : '-'}
                          </td>

                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              {/* If requested and no sample yet -> Collect Sample */}
                              {!req.sampleCollected && req.status === 'REQUESTED' && (
                                <button
                                  type="button"
                                  onClick={() => setCollectionModalState({ isOpen: true, request: req })}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}
                                  title="Collect physical specimen"
                                >
                                  <TestTube2 size={13} /> Collect
                                </button>
                              )}

                              {/* Enter Results */}
                              {(req.status === 'SAMPLE_COLLECTED' || req.status === 'IN_PROGRESS' || req.sampleCollected) && req.status !== 'CANCELLED' && (
                                <button
                                  type="button"
                                  onClick={() => setResultModalState({ isOpen: true, requestId: req.id })}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  title="Enter parameter findings"
                                >
                                  <ClipboardCheck size={13} /> Results
                                </button>
                              )}

                              {/* Report button */}
                              {req.hasReport ? (
                                <button
                                  type="button"
                                  onClick={() => setReportModalState({ isOpen: true, requestId: req.id, reportId: null })}
                                  className="btn btn-primary"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  title="View certified diagnostic report"
                                >
                                  <FileText size={13} /> Report
                                </button>
                              ) : (
                                (req.status === 'COMPLETED' || req.status === 'IN_PROGRESS') && (
                                  <button
                                    type="button"
                                    onClick={() => setReportModalState({ isOpen: true, requestId: req.id, reportId: null })}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}
                                    title="Generate formal report"
                                  >
                                    <FileText size={13} /> Gen Report
                                  </button>
                                )
                              )}

                              {/* Cancel action */}
                              {req.status !== 'COMPLETED' && req.status !== 'CANCELLED' && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelRequest(req)}
                                  className="btn-icon"
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)', padding: '4px' }}
                                  title="Cancel test order"
                                >
                                  <Ban size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* TAB 2: SAMPLE COLLECTION QUEUE */}
              {activeTab === 'samples' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Sample Barcode</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Test Request #</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Specimen Type</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Collection Site</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Collected By</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Collected At</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Advance Workflow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No collected specimens found in laboratory registry.
                        </td>
                      </tr>
                    ) : (
                      samples.map(sample => (
                        <tr key={sample.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--secondary)', letterSpacing: '0.04em' }}>
                              {sample.sampleBarcode}
                            </span>
                          </td>

                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--primary)' }}>
                            {sample.requestNumber}
                          </td>

                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--secondary)' }}>
                            {sample.sampleType}
                          </td>

                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                            {sample.collectionSite || 'Standard site'}
                          </td>

                          <td style={{ padding: '0.85rem 1rem', color: 'var(--secondary)' }}>
                            {sample.collectedByName}
                          </td>

                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {sample.collectedAt ? new Date(sample.collectedAt).toLocaleString() : '-'}
                          </td>

                          <td style={{ padding: '0.85rem 1rem' }}>
                            <SampleStatusBadge status={sample.status} />
                          </td>

                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            {sample.status === 'COLLECTED' && (
                              <button
                                type="button"
                                onClick={() => handleSampleStatusQuickAdvance(sample.id, sample.status)}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--primary)' }}
                              >
                                Mark Received in Lab
                              </button>
                            )}

                            {sample.status === 'RECEIVED_IN_LAB' && (
                              <button
                                type="button"
                                onClick={() => handleSampleStatusQuickAdvance(sample.id, sample.status)}
                                className="btn btn-primary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              >
                                Send to Processing
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* TAB 3: RESULT ENTRY QUEUE */}
              {activeTab === 'results' && (
                <div style={{ padding: '1rem' }}>
                  <div style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--primary-subtle)',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.82rem',
                    color: 'var(--primary-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <ClipboardCheck size={18} />
                    <span>
                      Specimens in the active result queue have samples acquired and are ready for parameter observation, quantification, and clinical flagging.
                    </span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>Request #</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Patient Name</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Tests Awaiting Entry</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Priority</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Current Status</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No active orders currently awaiting parameter results.
                          </td>
                        </tr>
                      ) : (
                        requests.map(req => (
                          <tr key={req.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                            <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>
                              {req.requestNumber}
                            </td>

                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{req.patientName}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{req.patientNumber}</div>
                            </td>

                            <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--secondary)' }}>
                              {req.testNames?.join(', ') || `${req.itemCount} Test(s)`}
                            </td>

                            <td style={{ padding: '0.85rem 1rem' }}>
                              <PriorityBadge priority={req.priority} />
                            </td>

                            <td style={{ padding: '0.85rem 1rem' }}>
                              <RequestStatusBadge status={req.status} />
                            </td>

                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => setResultModalState({ isOpen: true, requestId: req.id })}
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <ClipboardCheck size={14} /> Record Results
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: DIAGNOSTIC REPORTS */}
              {activeTab === 'reports' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Report #</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Order Ref #</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Patient Name</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Referring Physician</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Report Date</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No published laboratory diagnostic reports found.
                        </td>
                      </tr>
                    ) : (
                      reports.map(rpt => (
                        <tr key={rpt.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>
                              {rpt.reportNumber}
                            </span>
                          </td>

                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--primary)' }}>
                            {rpt.requestNumber}
                          </td>

                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{rpt.patientName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rpt.patientNumber}</div>
                          </td>

                          <td style={{ padding: '0.85rem 1rem', color: 'var(--secondary)' }}>
                            {rpt.doctorName}
                          </td>

                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {rpt.reportDate ? new Date(rpt.reportDate).toLocaleDateString() : '-'}
                          </td>

                          <td style={{ padding: '0.85rem 1rem' }}>
                            <ReportStatusBadge status={rpt.status} />
                          </td>

                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => setReportModalState({ isOpen: true, requestId: rpt.requestId, reportId: rpt.id })}
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Printer size={13} /> View & Print
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* TAB 5: TEST CATALOG */}
              {activeTab === 'catalog' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Test Code</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Investigation Name</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Discipline</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Sample Type</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Price (LKR)</th>
                      <th style={{ padding: '0.85rem 1rem' }}>TAT (Hours)</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Normal Range</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No test offerings found in catalog.
                        </td>
                      </tr>
                    ) : (
                      catalog.map(test => (
                        <tr key={test.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--primary-dark)', letterSpacing: '0.04em' }}>
                            {test.testCode}
                          </td>

                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{test.testName}</div>
                            {test.description && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {test.description}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: '#f1f5f9',
                              color: 'var(--secondary)'
                            }}>
                              {test.category}
                            </span>
                          </td>

                          <td style={{ padding: '0.85rem 1rem', color: 'var(--secondary)' }}>
                            {test.sampleType}
                          </td>

                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--secondary)' }}>
                            LKR {Number(test.price).toLocaleString()}
                          </td>

                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                            {test.turnaroundTimeHours}h
                          </td>

                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {test.referenceRange || '-'} {test.unit || ''}
                          </td>

                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => setCatalogModalState({ isOpen: true, editingTest: test })}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#ffffff'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing Page {page + 1} of {totalPages} ({totalElements} total entries)
            </span>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.7rem', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.7rem', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateLabRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadTabData()
          loadStats()
        }}
      />

      <SampleCollectionModal
        isOpen={collectionModalState.isOpen}
        request={collectionModalState.request}
        onClose={() => setCollectionModalState({ isOpen: false, request: null })}
        onSuccess={() => {
          loadTabData()
          loadStats()
        }}
      />

      <ResultEntryModal
        isOpen={resultModalState.isOpen}
        requestId={resultModalState.requestId}
        onClose={() => setResultModalState({ isOpen: false, requestId: null })}
        onSuccess={() => {
          loadTabData()
          loadStats()
        }}
      />

      <LabReportModal
        isOpen={reportModalState.isOpen}
        requestId={reportModalState.requestId}
        reportId={reportModalState.reportId}
        onClose={() => setReportModalState({ isOpen: false, requestId: null, reportId: null })}
        onSuccess={() => {
          loadTabData()
          loadStats()
        }}
      />

      <LabCatalogModal
        isOpen={catalogModalState.isOpen}
        editingTest={catalogModalState.editingTest}
        onClose={() => setCatalogModalState({ isOpen: false, editingTest: null })}
        onSuccess={() => {
          loadTabData()
          loadStats()
        }}
      />
    </div>
  )
}
