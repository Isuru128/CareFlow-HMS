import { useState, useEffect, useCallback } from 'react'
import { pharmacyApi } from '../../features/pharmacy/api/pharmacyApi'
import {
  CategoryBadge,
  DosageFormBadge,
  StockLevelBadge,
  BatchStatusBadge,
  ExpiryBadge,
  DispensationStatusBadge,
  PaymentStatusBadge
} from '../../features/pharmacy/components/PharmacyStatusBadge'
import MedicineModal from '../../features/pharmacy/components/MedicineModal'
import AddBatchModal from '../../features/pharmacy/components/AddBatchModal'
import StockAdjustmentModal from '../../features/pharmacy/components/StockAdjustmentModal'
import DispensePrescriptionModal from '../../features/pharmacy/components/DispensePrescriptionModal'
import DirectSaleModal from '../../features/pharmacy/components/DirectSaleModal'
import DispensationReceiptModal from '../../features/pharmacy/components/DispensationReceiptModal'

import {
  Pill,
  Layers,
  ClipboardList,
  AlertTriangle,
  History,
  Activity,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Edit,
  ArrowRight
} from 'lucide-react'

export default function PharmacyDashboardPage() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState('inventory') // 'inventory' | 'prescriptions' | 'batches' | 'expiry' | 'dispensations' | 'ledger'

  // Summary Metrics State
  const [stats, setStats] = useState({
    totalMedicines: 0,
    activeMedicines: 0,
    totalBatches: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
    todayDispensationsCount: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    totalInventoryValue: 0
  })

  // Table Data Collections
  const [medicines, setMedicines] = useState([])
  const [activeMedicinesList, setActiveMedicinesList] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [batches, setBatches] = useState([])
  const [expiringBatches, setExpiringBatches] = useState([])
  const [expiredBatches, setExpiredBatches] = useState([])
  const [dispensations, setDispensations] = useState([])
  const [transactions, setTransactions] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [dosageFilter, setDosageFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Pagination
  const [page, setPage] = useState(0)
  const [pageSize] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Modals
  const [medicineModal, setMedicineModal] = useState({ isOpen: false, editingMedicine: null })
  const [batchModal, setBatchModal] = useState({ isOpen: false, defaultMedicineId: null })
  const [adjustmentModal, setAdjustmentModal] = useState({ isOpen: false, batch: null })
  const [dispenseModal, setDispenseModal] = useState({ isOpen: false, prescription: null })
  const [directSaleModalOpen, setDirectSaleModalOpen] = useState(false)
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, dispensation: null })

  // Load KPI Stats
  const loadStats = async () => {
    try {
      const data = await pharmacyApi.getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load pharmacy dashboard statistics:', err)
    }
  }

  // Load Active Medicines for select dropdowns
  const loadActiveMedicines = async () => {
    try {
      const list = await pharmacyApi.getActiveMedicines()
      setActiveMedicinesList(list)
    } catch (err) {
      console.error('Failed to load active medicines:', err)
    }
  }

  // Load Tab Specific Data
  const loadTabData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (activeTab === 'inventory') {
        if (lowStockOnly) {
          const list = await pharmacyApi.getLowStockMedicines()
          setMedicines(list)
          setTotalPages(1)
          setTotalElements(list.length)
        } else {
          const data = await pharmacyApi.searchMedicines({
            query: searchQuery,
            category: categoryFilter,
            dosageForm: dosageFilter,
            isActive: statusFilter === 'ALL' ? '' : (statusFilter === 'ACTIVE'),
            page,
            size: pageSize
          })
          setMedicines(data.content || [])
          setTotalPages(data.totalPages || 1)
          setTotalElements(data.totalElements || 0)
        }
      } else if (activeTab === 'prescriptions') {
        const data = await pharmacyApi.getPendingPrescriptions({
          query: searchQuery,
          page,
          size: pageSize
        })
        setPrescriptions(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      } else if (activeTab === 'batches') {
        const data = await pharmacyApi.searchBatches({
          query: searchQuery,
          status: statusFilter,
          page,
          size: pageSize
        })
        setBatches(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      } else if (activeTab === 'expiry') {
        const [expiring, expired] = await Promise.all([
          pharmacyApi.getExpiringBatches(60),
          pharmacyApi.getExpiredBatches()
        ])
        setExpiringBatches(expiring || [])
        setExpiredBatches(expired || [])
      } else if (activeTab === 'dispensations') {
        const data = await pharmacyApi.searchDispensations({
          query: searchQuery,
          status: statusFilter,
          page,
          size: pageSize
        })
        setDispensations(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      } else if (activeTab === 'ledger') {
        const data = await pharmacyApi.searchStockTransactions({
          query: searchQuery,
          transactionType: statusFilter,
          page,
          size: pageSize
        })
        setTransactions(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      }
    } catch (err) {
      console.error('Failed to load pharmacy data:', err)
      setError('Unable to load data for the selected pharmacy view.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchQuery, categoryFilter, dosageFilter, statusFilter, lowStockOnly, page, pageSize])

  useEffect(() => {
    loadStats()
    loadActiveMedicines()
  }, [])

  useEffect(() => {
    setPage(0)
  }, [activeTab, searchQuery, categoryFilter, dosageFilter, statusFilter, lowStockOnly])

  useEffect(() => {
    loadTabData()
  }, [loadTabData])

  // Handle Medicine Save
  const handleSaveMedicine = async (formData) => {
    if (medicineModal.editingMedicine) {
      await pharmacyApi.updateMedicine(medicineModal.editingMedicine.id, formData)
    } else {
      await pharmacyApi.createMedicine(formData)
    }
    loadTabData()
    loadStats()
    loadActiveMedicines()
  }

  // Handle Deactivate Medicine
  const handleDeleteMedicine = async (med) => {
    if (window.confirm(`Deactivate medicine ${med.name} (${med.medicineCode})? It will not appear in new prescription choices.`)) {
      try {
        await pharmacyApi.deleteMedicine(med.id)
        loadTabData()
        loadStats()
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to deactivate medicine')
      }
    }
  }

  // Handle Batch Creation
  const handleSaveBatch = async (batchData) => {
    await pharmacyApi.createBatch(batchData)
    loadTabData()
    loadStats()
    loadActiveMedicines()
  }

  // Handle Stock Adjustment
  const handleSaveAdjustment = async (adjData) => {
    await pharmacyApi.adjustStock(adjData)
    loadTabData()
    loadStats()
  }

  // Handle Batch Quarantine or Disposal
  const handleUpdateBatchStatus = async (batchId, status, promptMsg) => {
    const notes = window.prompt(promptMsg || `Update batch status to ${status}. Enter audit notes:`)
    if (notes !== null) {
      try {
        await pharmacyApi.updateBatchStatus(batchId, status, notes)
        loadTabData()
        loadStats()
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update batch status')
      }
    }
  }

  // Handle Dispensation Cancellation
  const handleCancelDispensation = async (disp) => {
    const reason = window.prompt(`Are you sure you want to cancel dispensation ${disp.dispensationNumber}? Stock will be reversed to batches. Enter reason:`)
    if (reason) {
      try {
        await pharmacyApi.cancelDispensation(disp.id, reason)
        loadTabData()
        loadStats()
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to cancel dispensation')
      }
    }
  }

  return (
    <div className="container-fluid" style={{ padding: '1.5rem', minHeight: 'calc(100vh - 70px)' }}>
      {/* Top Header & Fast Action Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}>
            <Pill size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--secondary, #ffffff)', margin: 0, letterSpacing: '-0.01em' }}>
              Pharmacy & Dispensary Management
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
              Formulary Inventory, FEFO Prescription Fulfillment, Stock Control & Expiry Tracking
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => { loadTabData(); loadStats(); loadActiveMedicines() }}
            className="btn btn-secondary"
            title="Refresh Records"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setMedicineModal({ isOpen: true, editingMedicine: null })}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <Plus size={15} />
            <span>Add Medicine</span>
          </button>

          <button
            type="button"
            onClick={() => setBatchModal({ isOpen: true, defaultMedicineId: null })}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <Layers size={15} />
            <span>Receive Batch</span>
          </button>

          <button
            type="button"
            onClick={() => setDirectSaleModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <ShoppingBag size={15} />
            <span>OTC Sale</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prescriptions')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600 }}
          >
            <ClipboardList size={16} />
            <span>Fulfill Prescriptions</span>
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
        {/* Total Formulary Medicines */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Pill size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Formulary Items
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
              {stats.totalMedicines || 0}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
              {stats.activeMedicines || 0} currently active
            </span>
          </div>
        </div>

        {/* Inventory Value */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Stock Valuation
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', lineHeight: 1.2 }}>
              LKR {(stats.totalInventoryValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Across {stats.totalBatches || 0} procurement lots
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => { setActiveTab('inventory'); setLowStockOnly(prev => !prev) }}
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '1.15rem 1.25rem',
            border: `1px solid ${lowStockOnly ? '#fbbf24' : 'rgba(255, 255, 255, 0.08)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer'
          }}
          title="Click to toggle low stock filter"
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Low Stock Warnings
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1.2 }}>
              {stats.lowStockCount || 0}
            </div>
            <span style={{ fontSize: '0.72rem', color: lowStockOnly ? '#fbbf24' : '#94a3b8' }}>
              {lowStockOnly ? 'Filtered: Showing Low Stock' : 'Below reorder threshold'}
            </span>
          </div>
        </div>

        {/* Expiry Alerts */}
        <div
          onClick={() => setActiveTab('expiry')}
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '1.15rem 1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer'
          }}
          title="Click to view Expiry Monitoring Center"
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            color: '#fb7185',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Expiry Monitoring
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fb7185', lineHeight: 1.2 }}>
              {(stats.expiringSoonCount || 0) + (stats.expiredCount || 0)}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {stats.expiredCount || 0} expired | {stats.expiringSoonCount || 0} &lt;60 days
            </span>
          </div>
        </div>

        {/* Today's Dispensations & Revenue */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShoppingBag size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Today's Dispensations
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
              {stats.todayDispensationsCount || 0}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#818cf8' }}>
              Revenue: LKR {(stats.todayRevenue || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Section Card */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Tab Navigation Strip */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.6)'
        }}>
          {[
            { id: 'inventory', label: 'Medicines Inventory', icon: Pill, count: stats.totalMedicines },
            { id: 'prescriptions', label: 'Prescription Queue', icon: ClipboardList, badge: 'Rx' },
            { id: 'batches', label: 'Stock & Batches', icon: Layers, count: stats.totalBatches },
            { id: 'expiry', label: 'Expiry Monitoring', icon: AlertTriangle, count: (stats.expiringSoonCount || 0) + (stats.expiredCount || 0), alert: true },
            { id: 'dispensations', label: 'Dispensations History', icon: History },
            { id: 'ledger', label: 'Stock Movement Ledger', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setLowStockOnly(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.9rem 1.25rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    backgroundColor: tab.alert ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: tab.alert ? '#f87171' : '#cbd5e1',
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px',
                    fontWeight: 600
                  }}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px',
                    fontWeight: 700
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Filter Bar (Only shown for searchable tabs) */}
        {activeTab !== 'expiry' && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundColor: 'rgba(255, 255, 255, 0.01)'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', flex: '1 1 350px' }}>
              <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.2rem', fontSize: '0.82rem' }}
                  placeholder={
                    activeTab === 'inventory' ? 'Search medicine name, generic, code...' :
                    activeTab === 'prescriptions' ? 'Search Rx number, patient, doctor...' :
                    activeTab === 'batches' ? 'Search batch number, supplier, drug...' :
                    activeTab === 'dispensations' ? 'Search DSP number, patient, doctor...' :
                    'Search reference number, notes, medicine...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Dynamic Filters depending on Tab */}
              {activeTab === 'inventory' && (
                <>
                  <select
                    className="form-control"
                    style={{ maxWidth: '170px', fontSize: '0.82rem' }}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="ALL">All Categories</option>
                    <option value="ANALGESIC">Analgesic</option>
                    <option value="ANTIBIOTIC">Antibiotic</option>
                    <option value="ANTIHYPERTENSIVE">Antihypertensive</option>
                    <option value="ANTIDIABETIC">Antidiabetic</option>
                    <option value="ANTIHISTAMINE">Antihistamine</option>
                    <option value="ANTIPYRETIC">Antipyretic</option>
                    <option value="GASTROINTESTINAL">Gastrointestinal</option>
                    <option value="CARDIOVASCULAR">Cardiovascular</option>
                    <option value="RESPIRATORY">Respiratory</option>
                    <option value="VITAMINS_SUPPLEMENTS">Vitamins</option>
                    <option value="OTHER">Other</option>
                  </select>

                  <select
                    className="form-control"
                    style={{ maxWidth: '140px', fontSize: '0.82rem' }}
                    value={dosageFilter}
                    onChange={(e) => setDosageFilter(e.target.value)}
                  >
                    <option value="ALL">All Forms</option>
                    <option value="TABLET">Tablet</option>
                    <option value="CAPSULE">Capsule</option>
                    <option value="SYRUP">Syrup</option>
                    <option value="INJECTION">Injection</option>
                    <option value="INHALER">Inhaler</option>
                    <option value="OINTMENT">Ointment</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setLowStockOnly(prev => !prev)}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      borderColor: lowStockOnly ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                      color: lowStockOnly ? '#fbbf24' : '#cbd5e1'
                    }}
                  >
                    <AlertTriangle size={14} />
                    <span>Low Stock Only</span>
                  </button>
                </>
              )}

              {activeTab === 'batches' && (
                <select
                  className="form-control"
                  style={{ maxWidth: '160px', fontSize: '0.82rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Stock</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="DEPLETED">Depleted (0 Stock)</option>
                  <option value="RECALLED">Recalled</option>
                </select>
              )}

              {activeTab === 'dispensations' && (
                <select
                  className="form-control"
                  style={{ maxWidth: '160px', fontSize: '0.82rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Fulfilled</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Showing <strong>{totalElements}</strong> record(s)
            </div>
          </div>
        )}

        {/* Content Area */}
        <div style={{ padding: '1.25rem' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block', color: '#38bdf8' }} />
              <span>Loading pharmacy records...</span>
            </div>
          )}

          {error && (
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: INVENTORY */}
          {!loading && activeTab === 'inventory' && (
            medicines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
                <Pill size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <h4 style={{ margin: 0, color: '#e2e8f0' }}>No medicines found</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Try adjusting your search criteria or add a new drug formulary entry.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Medicine & Generic Name</th>
                      <th>Category</th>
                      <th>Form / Strength</th>
                      <th style={{ textAlign: 'right' }}>Unit Price (LKR)</th>
                      <th>Total Stock</th>
                      <th>Reorder Level</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.82rem' }}>
                            {m.medicineCode}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.88rem' }}>
                            {m.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Generic: {m.genericName} {m.brandName ? `(${m.brandName})` : ''}
                          </div>
                        </td>
                        <td>
                          <CategoryBadge category={m.category} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <DosageFormBadge form={m.dosageForm} />
                            <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{m.strength}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#34d399' }}>
                          {(m.unitPrice || 0).toFixed(2)}
                        </td>
                        <td>
                          <StockLevelBadge totalStock={m.totalStock || 0} reorderLevel={m.reorderLevel || 50} />
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                          {m.reorderLevel} {m.unitOfMeasure}s
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: m.isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: m.isActive ? '#34d399' : '#f87171'
                          }}>
                            {m.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setBatchModal({ isOpen: true, defaultMedicineId: m.id })}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              title="Receive new batch lot for this medicine"
                            >
                              <Layers size={13} />
                              <span>+ Batch</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMedicineModal({ isOpen: true, editingMedicine: m })}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.5rem' }}
                              title="Edit medicine details"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMedicine(m)}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.5rem', color: '#f87171' }}
                              title="Deactivate medicine"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* TAB 2: PRESCRIPTION QUEUE */}
          {!loading && activeTab === 'prescriptions' && (
            prescriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
                <ClipboardList size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <h4 style={{ margin: 0, color: '#e2e8f0' }}>No pending prescriptions</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>All physician prescription orders have been fulfilled or none match the filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {prescriptions.map((rx) => (
                  <div key={rx.id} style={{
                    padding: '1.15rem 1.25rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                          {rx.prescriptionNumber}
                        </span>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8'
                        }}>
                          {rx.status}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          Issued: {rx.issueDate}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>
                        Patient: {rx.patientName} <span style={{ color: '#38bdf8', fontWeight: 500 }}>({rx.patientNumber})</span> &bull; Prescribed by Dr. {rx.doctorName}
                      </div>

                      {/* Items Preview Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem' }}>
                        {rx.items && rx.items.map((it, idx) => (
                          <span key={idx} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            fontSize: '0.75rem',
                            color: '#cbd5e1'
                          }}>
                            <Pill size={11} color="#38bdf8" />
                            <strong>{it.medicationName}</strong> (Qty: {it.quantity})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setDispenseModal({ isOpen: true, prescription: rx })}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Fulfill & Dispense</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 3: BATCHES & STOCK */}
          {!loading && activeTab === 'batches' && (
            batches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
                <Layers size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <h4 style={{ margin: 0, color: '#e2e8f0' }}>No batches found</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Receive new inventory lots using the '+ Receive Batch' button above.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Batch #</th>
                      <th>Medicine</th>
                      <th>Expiry Date</th>
                      <th style={{ textAlign: 'center' }}>Stock Left</th>
                      <th style={{ textAlign: 'center' }}>Initial Qty</th>
                      <th style={{ textAlign: 'right' }}>Selling Price (LKR)</th>
                      <th>Supplier</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.82rem' }}>
                            {b.batchNumber}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.88rem' }}>
                            {b.medicineName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {b.medicineStrength} &bull; {b.medicineCode}
                          </div>
                        </td>
                        <td>
                          <ExpiryBadge expiryDate={b.expiryDate} daysUntilExpiry={b.daysUntilExpiry} isExpired={b.isExpired} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: b.currentQuantity === 0 ? '#f87171' : b.currentQuantity < 20 ? '#fbbf24' : '#34d399'
                          }}>
                            {b.currentQuantity}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                          {b.initialQuantity}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#cbd5e1' }}>
                          {(b.unitSellingPrice || 0).toFixed(2)}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {b.supplierName || 'Standard Consignment'}
                        </td>
                        <td>
                          <BatchStatusBadge status={b.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setAdjustmentModal({ isOpen: true, batch: b })}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              title="Adjust stock quantity"
                            >
                              <RefreshCw size={13} />
                              <span>Adjust</span>
                            </button>
                            {b.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateBatchStatus(b.id, 'RECALLED', 'Quarantine or recall batch lot')}
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.5rem', color: '#e879f9' }}
                                title="Recall batch"
                              >
                                <AlertTriangle size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* TAB 4: EXPIRY MONITORING */}
          {!loading && activeTab === 'expiry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Expired Batches Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <AlertCircle size={20} color="#f87171" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f87171' }}>
                    Expired Lots ({expiredBatches.length})
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Immediate quarantine or safe bio-medical disposal required
                  </span>
                </div>

                {expiredBatches.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', color: '#94a3b8' }}>
                    <CheckCircle2 size={24} style={{ color: '#34d399', margin: '0 auto 0.4rem', display: 'block' }} />
                    No expired drug lots detected in the dispensary.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Batch #</th>
                          <th>Medicine</th>
                          <th>Expired On</th>
                          <th style={{ textAlign: 'center' }}>Remaining Units</th>
                          <th>Supplier</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expiredBatches.map((b) => (
                          <tr key={b.id} style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                            <td style={{ fontWeight: 700, color: '#f87171' }}>{b.batchNumber}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#ffffff' }}>{b.medicineName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{b.medicineStrength}</div>
                            </td>
                            <td>
                              <ExpiryBadge expiryDate={b.expiryDate} daysUntilExpiry={b.daysUntilExpiry} isExpired={true} />
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: '#f87171' }}>
                              {b.currentQuantity}
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{b.supplierName || 'N/A'}</td>
                            <td><BatchStatusBadge status={b.status} /></td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateBatchStatus(b.id, 'EXPIRED', 'Confirm disposal & write-off of expired lot')}
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              >
                                Write-Off & Dispose
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Expiring Soon (< 60 days) Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Clock size={20} color="#fbbf24" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fbbf24' }}>
                    Expiring Within 60 Days ({expiringBatches.length})
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Prioritize for FEFO prescription dispensing
                  </span>
                </div>

                {expiringBatches.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', color: '#94a3b8' }}>
                    <CheckCircle2 size={24} style={{ color: '#34d399', margin: '0 auto 0.4rem', display: 'block' }} />
                    No batches expiring within the next 60 days.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Batch #</th>
                          <th>Medicine</th>
                          <th>Expiry Countdown</th>
                          <th style={{ textAlign: 'center' }}>Units in Stock</th>
                          <th style={{ textAlign: 'right' }}>Unit Price (LKR)</th>
                          <th>Supplier</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expiringBatches.map((b) => (
                          <tr key={b.id}>
                            <td style={{ fontWeight: 700, color: '#38bdf8' }}>{b.batchNumber}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#ffffff' }}>{b.medicineName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{b.medicineStrength}</div>
                            </td>
                            <td>
                              <ExpiryBadge expiryDate={b.expiryDate} daysUntilExpiry={b.daysUntilExpiry} isExpired={false} />
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: '#fbbf24' }}>
                              {b.currentQuantity}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#cbd5e1' }}>
                              {(b.unitSellingPrice || 0).toFixed(2)}
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{b.supplierName || 'N/A'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => setActiveTab('prescriptions')}
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Dispense First &rarr;
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DISPENSATIONS HISTORY */}
          {!loading && activeTab === 'dispensations' && (
            dispensations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
                <History size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <h4 style={{ margin: 0, color: '#e2e8f0' }}>No dispensations recorded</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Dispensed prescriptions and counter sales will appear here.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>DSP #</th>
                      <th>Patient</th>
                      <th>Type / Reference</th>
                      <th>Dispensed At</th>
                      <th>Pharmacist</th>
                      <th style={{ textAlign: 'right' }}>Total (LKR)</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispensations.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.82rem' }}>
                            {d.dispensationNumber}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{d.patientName}</div>
                          {d.patientNumber && (
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{d.patientNumber}</div>
                          )}
                        </td>
                        <td>
                          {d.prescriptionNumber ? (
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                              Rx: <strong style={{ color: '#38bdf8' }}>{d.prescriptionNumber}</strong>
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              Direct OTC Sale
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {new Date(d.dispensedAt).toLocaleString()}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                          {d.dispensedByName}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                          {(d.totalAmount || 0).toFixed(2)}
                        </td>
                        <td>
                          <PaymentStatusBadge status={d.paymentStatus} />
                        </td>
                        <td>
                          <DispensationStatusBadge status={d.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setReceiptModal({ isOpen: true, dispensation: d })}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              title="View & Print Receipt"
                            >
                              <Eye size={13} />
                              <span>Receipt</span>
                            </button>
                            {d.status === 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() => handleCancelDispensation(d)}
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.5rem', color: '#f87171' }}
                                title="Cancel Dispensation & Reverse Stock"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* TAB 6: STOCK MOVEMENT LEDGER */}
          {!loading && activeTab === 'ledger' && (
            transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
                <Activity size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <h4 style={{ margin: 0, color: '#e2e8f0' }}>No stock transactions logged</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Every stock movement is recorded here automatically.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Date / Time</th>
                      <th>Medicine</th>
                      <th>Batch</th>
                      <th>Transaction Type</th>
                      <th style={{ textAlign: 'center' }}>Movement Delta</th>
                      <th style={{ textAlign: 'center' }}>Balance After</th>
                      <th>Reference #</th>
                      <th>Performed By</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>
                            {tx.medicineName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{tx.medicineCode}</div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
                          {tx.batchNumber || 'N/A'}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor:
                              tx.transactionType === 'PURCHASE_RECEIPT' ? 'rgba(16, 185, 129, 0.12)' :
                              tx.transactionType === 'DISPENSE' ? 'rgba(56, 189, 248, 0.12)' :
                              tx.transactionType === 'STOCK_ADJUSTMENT' ? 'rgba(245, 158, 11, 0.12)' :
                              'rgba(239, 68, 68, 0.12)',
                            color:
                              tx.transactionType === 'PURCHASE_RECEIPT' ? '#34d399' :
                              tx.transactionType === 'DISPENSE' ? '#38bdf8' :
                              tx.transactionType === 'STOCK_ADJUSTMENT' ? '#fbbf24' :
                              '#f87171'
                          }}>
                            {tx.transactionType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: tx.quantity > 0 ? '#34d399' : '#f87171' }}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#cbd5e1' }}>
                          {tx.balanceAfter}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                          {tx.referenceNumber || 'N/A'}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                          {tx.performedByName}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tx.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Pagination Controls */}
          {activeTab !== 'expiry' && totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              marginTop: '1rem'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} items)
              </span>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <MedicineModal
        isOpen={medicineModal.isOpen}
        onClose={() => setMedicineModal({ isOpen: false, editingMedicine: null })}
        onSave={handleSaveMedicine}
        editingMedicine={medicineModal.editingMedicine}
      />

      <AddBatchModal
        isOpen={batchModal.isOpen}
        onClose={() => setBatchModal({ isOpen: false, defaultMedicineId: null })}
        onSave={handleSaveBatch}
        medicines={activeMedicinesList}
        defaultMedicineId={batchModal.defaultMedicineId}
      />

      <StockAdjustmentModal
        isOpen={adjustmentModal.isOpen}
        onClose={() => setAdjustmentModal({ isOpen: false, batch: null })}
        onSave={handleSaveAdjustment}
        batch={adjustmentModal.batch}
      />

      <DispensePrescriptionModal
        isOpen={dispenseModal.isOpen}
        onClose={() => setDispenseModal({ isOpen: false, prescription: null })}
        onDispensed={(disp) => {
          loadTabData()
          loadStats()
          setReceiptModal({ isOpen: true, dispensation: disp })
        }}
        prescription={dispenseModal.prescription}
        medicines={activeMedicinesList}
      />

      <DirectSaleModal
        isOpen={directSaleModalOpen}
        onClose={() => setDirectSaleModalOpen(false)}
        onSaleCompleted={(disp) => {
          loadTabData()
          loadStats()
          setReceiptModal({ isOpen: true, dispensation: disp })
        }}
        medicines={activeMedicinesList}
      />

      <DispensationReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal({ isOpen: false, dispensation: null })}
        dispensation={receiptModal.dispensation}
      />
    </div>
  )
}
