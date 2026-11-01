import React, { useState, useEffect, useCallback } from 'react'
import { billingApi } from '../../features/billing/api/billingApi'
import {
  InvoiceStatusBadge,
  ChargeTypeBadge,
  PaymentMethodBadge,
  PaymentRecordStatusBadge,
  AdmissionStatusBadge,
  RoomTypeBadge
} from '../../features/billing/components/BillingStatusBadge'
import GenerateInvoiceModal from '../../features/billing/components/GenerateInvoiceModal'
import RecordPaymentModal from '../../features/billing/components/RecordPaymentModal'
import InvoiceReceiptModal from '../../features/billing/components/InvoiceReceiptModal'
import AdmissionModal from '../../features/billing/components/AdmissionModal'

import {
  Receipt,
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Plus,
  Printer,
  Ban,
  BedDouble,
  Stethoscope,
  FlaskConical,
  Pill,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileText,
  UserCheck,
  LogOut
} from 'lucide-react'

export default function BillingDashboardPage() {
  // Active View Tab
  const [activeTab, setActiveTab] = useState('invoices') // 'invoices' | 'charges' | 'payments' | 'admissions'

  // Summary Metrics
  const [stats, setStats] = useState({
    totalInvoices: 0,
    issuedInvoicesCount: 0,
    paidInvoicesCount: 0,
    partiallyPaidCount: 0,
    overdueInvoicesCount: 0,
    activeAdmissionsCount: 0,
    totalBilledAmount: 0,
    totalCollectedAmount: 0,
    outstandingReceivables: 0,
    todayCollections: 0,
    todayPaymentsCount: 0,
    consultationRevenue: 0,
    laboratoryRevenue: 0,
    pharmacyRevenue: 0,
    admissionRevenue: 0,
    otherRevenue: 0
  })

  // Data Collections
  const [invoices, setInvoices] = useState([])
  const [openInvoicesList, setOpenInvoicesList] = useState([])
  const [payments, setPayments] = useState([])
  const [admissions, setAdmissions] = useState([])
  const [patients, setPatients] = useState([])

  // Patient Charge Inspector State (in 'charges' tab)
  const [inspectorPatientId, setInspectorPatientId] = useState('')
  const [inspectedCharges, setInspectedCharges] = useState([])
  const [loadingInspector, setLoadingInspector] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [roomFilter, setRoomFilter] = useState('ALL')

  // Pagination
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Modals State
  const [generateModal, setGenerateModal] = useState({
    isOpen: false,
    preselectedPatientId: null,
    preloadedItems: null
  })
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    invoice: null
  })
  const [receiptModal, setReceiptModal] = useState({
    isOpen: false,
    invoice: null
  })
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false)

  // Load KPI Stats
  const loadStats = async () => {
    try {
      const data = await billingApi.getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load billing statistics:', err)
    }
  }

  // Load Open Invoices & Patients for Quick Actions
  const loadReferenceLists = async () => {
    try {
      const [invData, pts] = await Promise.all([
        billingApi.searchInvoices({ page: 0, size: 100 }).catch(() => ({ content: [] })),
        billingApi.getPatientsList().catch(() => [])
      ])
      setOpenInvoicesList(invData.content || [])
      setPatients(pts || [])
      if (pts && pts.length > 0 && !inspectorPatientId) {
        setInspectorPatientId(String(pts[0].id))
      }
    } catch (err) {
      console.error('Failed to load reference lists:', err)
    }
  }

  // Load Tab Specific Data
  const loadTabData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeTab === 'invoices') {
        const data = await billingApi.searchInvoices({
          query: searchQuery,
          status: statusFilter,
          page,
          size: pageSize
        })
        setInvoices(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      } else if (activeTab === 'payments') {
        const data = await billingApi.searchPayments({
          query: searchQuery,
          paymentMethod: methodFilter,
          status: statusFilter,
          page,
          size: pageSize
        })
        setPayments(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      } else if (activeTab === 'admissions') {
        const data = await billingApi.searchAdmissions({
          query: searchQuery,
          status: statusFilter,
          roomType: roomFilter,
          page,
          size: pageSize
        })
        setAdmissions(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      }
    } catch (err) {
      console.error('Failed to load billing tab data:', err)
      setError('Unable to load records for the selected billing view.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchQuery, statusFilter, methodFilter, roomFilter, page, pageSize])

  // Load Inspected Patient Charges when in 'charges' tab
  useEffect(() => {
    if (activeTab === 'charges' && inspectorPatientId) {
      setLoadingInspector(true)
      billingApi
        .getPatientBillableCharges(inspectorPatientId)
        .then(data => setInspectedCharges(data || []))
        .catch(() => setInspectedCharges([]))
        .finally(() => setLoadingInspector(false))
    }
  }, [activeTab, inspectorPatientId])

  useEffect(() => {
    loadStats()
    loadReferenceLists()
  }, [])

  useEffect(() => {
    setPage(0)
    setStatusFilter('ALL')
  }, [activeTab, searchQuery, methodFilter, roomFilter])

  useEffect(() => {
    loadTabData()
  }, [loadTabData])

  const refreshAll = () => {
    loadStats()
    loadTabData()
    loadReferenceLists()
    if (activeTab === 'charges' && inspectorPatientId) {
      billingApi.getPatientBillableCharges(inspectorPatientId).then(setInspectedCharges).catch(() => {})
    }
  }

  // Cancel Invoice
  const handleCancelInvoice = async (inv) => {
    const reason = window.prompt(`Cancel invoice ${inv.invoiceNumber} for ${inv.patientName}? Enter cancellation reason:`)
    if (reason) {
      try {
        await billingApi.cancelInvoice(inv.id, reason)
        refreshAll()
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to cancel invoice.')
      }
    }
  }

  // Refund Payment
  const handleRefundPayment = async (pay) => {
    const reason = window.prompt(`Refund payment ${pay.paymentNumber} (LKR ${Number(pay.amount).toLocaleString()})? Invoice balance will be adjusted. Enter reason:`)
    if (reason) {
      try {
        await billingApi.refundPayment(pay.id, reason)
        refreshAll()
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to refund payment.')
      }
    }
  }

  // Discharge Admission
  const handleDischargeAdmission = async (adm) => {
    const notes = window.prompt(`Discharge patient ${adm.patientName} from ${adm.wardName} (Bed ${adm.bedNumber})? Enter discharge summary notes:`, 'Discharged in stable condition.')
    if (notes !== null) {
      try {
        await billingApi.dischargeAdmission(adm.id, {
          dischargeNotes: notes,
          status: 'DISCHARGED'
        })
        refreshAll()
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to discharge patient.')
      }
    }
  }

  // Open Generate Bill Modal pre-filled with an Admission charge
  const handleBillAdmission = (adm) => {
    const dailyTariff = (Number(adm.dailyRoomRate) || 0) + (Number(adm.nursingFeePerDay) || 0)
    setGenerateModal({
      isOpen: true,
      preselectedPatientId: adm.patientId,
      preloadedItems: [
        {
          chargeType: 'ADMISSION',
          referenceType: 'ADMISSION',
          referenceId: adm.id,
          referenceCode: adm.admissionNumber,
          description: `Inpatient Admission: ${adm.wardName} (Bed ${adm.bedNumber}, ${adm.roomType}) - Room & Nursing Care`,
          serviceDate: new Date().toISOString().split('T')[0],
          quantity: adm.lengthOfStayDays || 1,
          unitPrice: dailyTariff,
          discountAmount: 0
        }
      ]
    })
  }

  // Open Receipt Modal for a Payment record by fetching its parent Invoice
  const handleViewPaymentInvoice = async (pay) => {
    try {
      const inv = await billingApi.getInvoiceById(pay.invoiceId)
      setReceiptModal({ isOpen: true, invoice: inv })
    } catch (err) {
      alert('Unable to load invoice details for this receipt.')
    }
  }

  const totalRevenueSum =
    (Number(stats.consultationRevenue) || 0) +
    (Number(stats.laboratoryRevenue) || 0) +
    (Number(stats.pharmacyRevenue) || 0) +
    (Number(stats.admissionRevenue) || 0) +
    (Number(stats.otherRevenue) || 0)

  const getPercentage = (val) => {
    if (!totalRevenueSum || totalRevenueSum <= 0) return 0
    return Math.round(((Number(val) || 0) / totalRevenueSum) * 100)
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header & Fast Action Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
          }}>
            <Receipt size={25} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--secondary)', margin: 0, letterSpacing: '-0.01em' }}>
              Billing, Invoicing & Revenue Management
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Consultation, Laboratory, Pharmacy & Admission Charges • Invoice Generation & Payment Recording
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={refreshAll}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setAdmissionModalOpen(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem' }}
          >
            <BedDouble size={16} />
            <span>Admit Patient (Ward)</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentModal({ isOpen: true, invoice: null })}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', borderColor: '#059669', color: '#059669' }}
          >
            <CreditCard size={16} />
            <span>Receive Payment</span>
          </button>

          <button
            type="button"
            onClick={() => setGenerateModal({ isOpen: true, preselectedPatientId: null, preloadedItems: null })}
            className="btn btn-primary"
            style={{ fontSize: '0.82rem', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Generate Bill / Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(225px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* 1. Total Billed Revenue */}
        <div className="card" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <Receipt size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Billed Value
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)' }}>
              LKR {Number(stats.totalBilledAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>
              {stats.totalInvoices || 0} Total Invoice(s)
            </div>
          </div>
        </div>

        {/* 2. Total Collected Revenue */}
        <div className="card" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Collected
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>
              LKR {Number(stats.totalCollectedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {stats.paidInvoicesCount || 0} Settled in Full
            </div>
          </div>
        </div>

        {/* 3. Outstanding Receivables */}
        <div className="card" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Outstanding Balance
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#d97706' }}>
              LKR {Number(stats.outstandingReceivables || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {(stats.issuedInvoicesCount || 0) + (stats.partiallyPaidCount || 0)} Open / Partial Bill(s)
            </div>
          </div>
        </div>

        {/* 4. Today's Collections */}
        <div className="card" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: '#ede9fe', color: '#6d28d9' }}>
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Today's Receipts
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#6d28d9' }}>
              LKR {Number(stats.todayCollections || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {stats.todayPaymentsCount || 0} Payment(s) Today
            </div>
          </div>
        </div>

        {/* 5. Active Inpatient Admissions */}
        <div
          onClick={() => setActiveTab('admissions')}
          className="card card-hover"
          style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
        >
          <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: '#fce7f3', color: '#be185d' }}>
            <BedDouble size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Admissions
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#be185d' }}>
              {stats.activeAdmissionsCount || 0} Bed(s)
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Admission Rev: LKR {Number(stats.admissionRevenue || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card with Tabs */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border)',
          backgroundColor: '#f8fafc',
          padding: '0 1rem'
        }}>
          {[
            { id: 'invoices', label: 'Invoices & Bills', icon: Receipt, count: stats.totalInvoices },
            { id: 'charges', label: 'Charge Categories & Patient Bill Inspector', icon: DollarSign },
            { id: 'payments', label: 'Payment Receipts Ledger', icon: CreditCard },
            { id: 'admissions', label: 'Inpatient Admissions & Ward Charges', icon: BedDouble, count: stats.activeAdmissionsCount }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${isActive ? 'active' : ''}`}
                style={{ padding: '0.95rem 1.15rem' }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    backgroundColor: isActive ? '#e0f2fe' : '#e2e8f0',
                    color: isActive ? '#0284c7' : '#475569',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Filter Bar (Shown for Invoices, Payments, Admissions tabs) */}
        {activeTab !== 'charges' && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', flex: '1 1 360px' }}>
              <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 280px', maxWidth: '420px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.25rem', fontSize: '0.82rem' }}
                  placeholder={
                    activeTab === 'invoices'
                      ? 'Search invoice number (INV-...), patient name, or ID...'
                      : activeTab === 'payments'
                      ? 'Search payment receipt (PAY-...), invoice, patient, or TXN ref...'
                      : 'Search admission number (ADM-...), ward, bed, or patient...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {activeTab === 'invoices' && (
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '175px', fontSize: '0.82rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Invoice Statuses</option>
                  <option value="ISSUED">Issued (Unpaid)</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="PAID">Paid in Full</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              )}

              {activeTab === 'payments' && (
                <>
                  <select
                    className="form-select"
                    style={{ width: 'auto', minWidth: '170px', fontSize: '0.82rem' }}
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                  >
                    <option value="ALL">All Payment Methods</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="INSURANCE">Insurance Claim</option>
                    <option value="ONLINE">Online Gateway</option>
                    <option value="CHEQUE">Bank Cheque</option>
                  </select>

                  <select
                    className="form-select"
                    style={{ width: 'auto', minWidth: '150px', fontSize: '0.82rem' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </>
              )}

              {activeTab === 'admissions' && (
                <>
                  <select
                    className="form-select"
                    style={{ width: 'auto', minWidth: '165px', fontSize: '0.82rem' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Admission Statuses</option>
                    <option value="ADMITTED">Admitted (Active)</option>
                    <option value="DISCHARGED">Discharged</option>
                    <option value="TRANSFERRED">Transferred</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  <select
                    className="form-select"
                    style={{ width: 'auto', minWidth: '165px', fontSize: '0.82rem' }}
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value)}
                  >
                    <option value="ALL">All Room Categories</option>
                    <option value="GENERAL_WARD">General Ward</option>
                    <option value="SEMI_PRIVATE">Semi-Private Room</option>
                    <option value="PRIVATE_ROOM">Private Room</option>
                    <option value="DELUXE_SUITE">Deluxe Suite</option>
                    <option value="ICU">ICU</option>
                    <option value="EMERGENCY_OBSERVATION">Emergency Obs.</option>
                  </select>
                </>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing <strong>{totalElements}</strong> record(s)
            </div>
          </div>
        )}

        {/* Tab Content Body */}
        <div style={{ padding: '1.25rem' }}>
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading && activeTab !== 'charges' && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <RefreshCw size={26} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--primary)' }} />
              <span>Loading hospital billing records...</span>
            </div>
          )}

          {/* ===================================================================
              TAB 1: INVOICES & BILLS
             =================================================================== */}
          {!loading && activeTab === 'invoices' && (
            invoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Receipt size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>No invoices found</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Generate a new hospital invoice consolidating Consultation, Lab, Pharmacy, or Admission charges.
                </p>
                <button
                  type="button"
                  onClick={() => setGenerateModal({ isOpen: true, preselectedPatientId: null, preloadedItems: null })}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  <span>Generate First Invoice</span>
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice No.</th>
                      <th>Patient</th>
                      <th>Included Charge Categories</th>
                      <th style={{ textAlign: 'right' }}>Total Bill</th>
                      <th style={{ textAlign: 'right' }}>Paid</th>
                      <th style={{ textAlign: 'right' }}>Balance Due</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => {
                      const uniqueChargeTypes = Array.from(
                        new Set((inv.items || []).map(i => i.chargeType))
                      )
                      return (
                        <tr key={inv.id}>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.9rem' }}>
                              {inv.invoiceNumber}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                              {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : ''}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {inv.patientName}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {inv.patientNumber} {inv.patientContact ? `• ${inv.patientContact}` : ''}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                              {uniqueChargeTypes.map(ct => (
                                <ChargeTypeBadge key={ct} chargeType={ct} />
                              ))}
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                ({(inv.items || []).length} item{(inv.items || []).length === 1 ? '' : 's'})
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            LKR {Number(inv.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                            LKR {Number(inv.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{
                            textAlign: 'right',
                            fontWeight: 800,
                            color: Number(inv.balanceDue) > 0 ? '#dc2626' : '#059669'
                          }}>
                            LKR {Number(inv.balanceDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <InvoiceStatusBadge status={inv.status} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() => setReceiptModal({ isOpen: true, invoice: inv })}
                                className="btn btn-secondary btn-sm"
                                title="View & Print Invoice / Receipt"
                              >
                                <Printer size={14} />
                                <span>Receipt</span>
                              </button>

                              {Number(inv.balanceDue) > 0 && inv.status !== 'CANCELLED' && (
                                <button
                                  type="button"
                                  onClick={() => setPaymentModal({ isOpen: true, invoice: inv })}
                                  className="btn btn-primary btn-sm"
                                  style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                                  title="Receive Payment"
                                >
                                  <CreditCard size={14} />
                                  <span>Pay</span>
                                </button>
                              )}

                              {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelInvoice(inv)}
                                  className="btn btn-danger-outline btn-sm"
                                  title="Cancel Invoice"
                                >
                                  <Ban size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ===================================================================
              TAB 2: CHARGE CATEGORIES & PATIENT BILL INSPECTOR (3.8 Pillars)
             =================================================================== */}
          {activeTab === 'charges' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* 4 Charge Categories Revenue Breakdown Grid */}
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                  Hospital Revenue Breakdown by 3.8 Charge Category
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))',
                  gap: '1rem'
                }}>
                  {[
                    {
                      type: 'CONSULTATION',
                      title: 'Consultation Charges',
                      subtitle: 'Specialist & OPD Doctor Visits',
                      amount: stats.consultationRevenue,
                      color: '#0284c7',
                      bg: '#e0f2fe',
                      icon: Stethoscope
                    },
                    {
                      type: 'LABORATORY',
                      title: 'Laboratory Charges',
                      subtitle: 'Hematology, Biochemistry & Scans',
                      amount: stats.laboratoryRevenue,
                      color: '#6d28d9',
                      bg: '#ede9fe',
                      icon: FlaskConical
                    },
                    {
                      type: 'PHARMACY',
                      title: 'Pharmacy Charges',
                      subtitle: 'Prescriptions & Dispensary Sales',
                      amount: stats.pharmacyRevenue,
                      color: '#0f766e',
                      bg: '#ccfbf1',
                      icon: Pill
                    },
                    {
                      type: 'ADMISSION',
                      title: 'Admission Charges',
                      subtitle: 'Inpatient Ward, Bed & Nursing Stays',
                      amount: stats.admissionRevenue,
                      color: '#b45309',
                      bg: '#fef3c7',
                      icon: BedDouble
                    }
                  ].map(cat => {
                    const Icon = cat.icon
                    const pct = getPercentage(cat.amount)
                    return (
                      <div
                        key={cat.type}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          padding: '1.15rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div style={{ padding: '9px', borderRadius: '10px', backgroundColor: cat.bg, color: cat.color }}>
                            <Icon size={20} />
                          </div>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: cat.color,
                            backgroundColor: cat.bg,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px'
                          }}>
                            {pct}% of Revenue
                          </span>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {cat.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                          {cat.subtitle}
                        </div>

                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: cat.color, marginBottom: '0.5rem' }}>
                          LKR {Number(cat.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>

                        <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(4, pct)}%`, height: '100%', backgroundColor: cat.color, borderRadius: '999px' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Interactive Patient Billable Charge Inspector */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '1.25rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Patient Billable Charge Inspector & Consolidated Bill Builder
                    </h3>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Select a patient to inspect all their Consultation, Laboratory, Pharmacy, and Admission charges across the hospital
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <select
                      className="form-select"
                      style={{ minWidth: '280px' }}
                      value={inspectorPatientId}
                      onChange={(e) => setInspectorPatientId(e.target.value)}
                    >
                      <option value="">-- Select Patient to Inspect --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.patientNumber} — {p.firstName} {p.lastName} ({p.contactNumber})
                        </option>
                      ))}
                    </select>

                    {inspectorPatientId && (
                      <button
                        type="button"
                        onClick={() => {
                          const unbilled = inspectedCharges.filter(c => !c.alreadyBilled)
                          const source = unbilled.length > 0 ? unbilled : inspectedCharges
                          setGenerateModal({
                            isOpen: true,
                            preselectedPatientId: Number(inspectorPatientId),
                            preloadedItems: source.length > 0
                              ? source.map(c => ({
                                  chargeType: c.chargeType,
                                  referenceType: c.referenceType || 'SYSTEM',
                                  referenceId: c.referenceId || null,
                                  referenceCode: c.referenceCode || '',
                                  description: c.description,
                                  serviceDate: c.serviceDate || new Date().toISOString().split('T')[0],
                                  quantity: c.quantity || 1,
                                  unitPrice: Number(c.unitPrice) || 0,
                                  discountAmount: 0
                                }))
                              : null
                          })
                        }}
                        className="btn btn-primary"
                      >
                        <Receipt size={16} />
                        <span>Generate Consolidated Invoice for Patient</span>
                      </button>
                    )}
                  </div>
                </div>

                {loadingInspector ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading patient charges...
                  </div>
                ) : inspectedCharges.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    No clinical charges found for the selected patient.
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Charge Category</th>
                          <th>Ref Code</th>
                          <th>Clinical Service Description</th>
                          <th>Service Date</th>
                          <th style={{ textAlign: 'center' }}>Qty / Days</th>
                          <th style={{ textAlign: 'right' }}>Unit Price</th>
                          <th style={{ textAlign: 'right' }}>Subtotal</th>
                          <th>Billing Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectedCharges.map((chg, idx) => (
                          <tr key={idx}>
                            <td>
                              <ChargeTypeBadge chargeType={chg.chargeType} />
                            </td>
                            <td>
                              <strong style={{ color: '#0284c7', fontSize: '0.82rem' }}>{chg.referenceCode}</strong>
                            </td>
                            <td style={{ fontWeight: 600 }}>{chg.description}</td>
                            <td>{chg.serviceDate || '—'}</td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{chg.quantity}</td>
                            <td style={{ textAlign: 'right' }}>
                              LKR {Number(chg.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              LKR {Number(chg.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td>
                              {chg.alreadyBilled ? (
                                <span className="badge badge-active">Invoiced</span>
                              ) : (
                                <span className="badge badge-locked">Unbilled</span>
                              )}
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

          {/* ===================================================================
              TAB 3: PAYMENT RECEIPTS LEDGER
             =================================================================== */}
          {!loading && activeTab === 'payments' && (
            payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <CreditCard size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>No payment records found</h3>
                <p style={{ fontSize: '0.85rem' }}>Recorded patient payments and official receipts will appear here.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Receipt No.</th>
                      <th>Invoice No.</th>
                      <th>Patient / Payer</th>
                      <th>Payment Method</th>
                      <th>Transaction / Policy Ref</th>
                      <th style={{ textAlign: 'right' }}>Amount Paid</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(pay => (
                      <tr key={pay.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.88rem' }}>
                            {pay.paymentNumber}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {pay.paymentDate ? new Date(pay.paymentDate).toLocaleString() : ''}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#0284c7' }}>{pay.invoiceNumber}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{pay.patientName}</div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                            {pay.patientNumber} {pay.payerName && pay.payerName !== pay.patientName ? `• Payer: ${pay.payerName}` : ''}
                          </div>
                        </td>
                        <td>
                          <PaymentMethodBadge method={pay.paymentMethod} />
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {pay.transactionReference || (pay.insuranceProvider ? `${pay.insuranceProvider} (${pay.insurancePolicyNumber || ''})` : 'Counter Settlement')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#047857' }}>
                          LKR {Number(pay.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <PaymentRecordStatusBadge status={pay.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => handleViewPaymentInvoice(pay)}
                              className="btn btn-secondary btn-sm"
                              title="Print Official Receipt"
                            >
                              <Printer size={14} />
                              <span>Print Receipt</span>
                            </button>

                            {pay.status === 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() => handleRefundPayment(pay)}
                                className="btn btn-danger-outline btn-sm"
                                title="Refund Payment"
                              >
                                <RotateCcw size={14} />
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

          {/* ===================================================================
              TAB 4: INPATIENT ADMISSIONS & WARD CHARGES
             =================================================================== */}
          {!loading && activeTab === 'admissions' && (
            admissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <BedDouble size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>No inpatient admissions found</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Admit patients to hospital wards and track daily room & nursing charges.
                </p>
                <button
                  type="button"
                  onClick={() => setAdmissionModalOpen(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  <span>Admit Patient</span>
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Admission No.</th>
                      <th>Patient</th>
                      <th>Ward & Bed</th>
                      <th>Attending Doctor</th>
                      <th style={{ textAlign: 'center' }}>Stay Duration</th>
                      <th style={{ textAlign: 'right' }}>Daily Tariff</th>
                      <th style={{ textAlign: 'right' }}>Accrued Admission Charge</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admissions.map(adm => {
                      const dailyTariff = (Number(adm.dailyRoomRate) || 0) + (Number(adm.nursingFeePerDay) || 0)
                      return (
                        <tr key={adm.id}>
                          <td>
                            <div style={{ fontWeight: 800, color: '#b45309', fontSize: '0.88rem' }}>
                              {adm.admissionNumber}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              In: {adm.admissionDate ? new Date(adm.admissionDate).toLocaleDateString() : ''}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{adm.patientName}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{adm.patientNumber}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                              {adm.wardName} • <strong style={{ color: '#0284c7' }}>Bed {adm.bedNumber}</strong>
                            </div>
                            <RoomTypeBadge roomType={adm.roomType} />
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>
                            {adm.attendingDoctorName ? `Dr. ${adm.attendingDoctorName}` : 'Duty Medical Officer'}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>
                            {adm.lengthOfStayDays || 1} Day(s)
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            LKR {dailyTariff.toLocaleString(undefined, { minimumFractionDigits: 2 })}/day
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#b45309' }}>
                            LKR {Number(adm.estimatedTotalAdmissionCharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <AdmissionStatusBadge status={adm.status} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() => handleBillAdmission(adm)}
                                className="btn btn-primary btn-sm"
                                title="Generate Invoice with this Admission Charge"
                              >
                                <Receipt size={14} />
                                <span>Bill Stay</span>
                              </button>

                              {adm.status === 'ADMITTED' && (
                                <button
                                  type="button"
                                  onClick={() => handleDischargeAdmission(adm)}
                                  className="btn btn-secondary btn-sm"
                                  title="Discharge Patient"
                                >
                                  <LogOut size={14} />
                                  <span>Discharge</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Pagination Footer */}
          {activeTab !== 'charges' && totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronLeft size={15} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="btn btn-secondary btn-sm"
                >
                  <span>Next</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <GenerateInvoiceModal
        isOpen={generateModal.isOpen}
        onClose={() => setGenerateModal({ isOpen: false, preselectedPatientId: null, preloadedItems: null })}
        preselectedPatientId={generateModal.preselectedPatientId}
        preloadedItems={generateModal.preloadedItems}
        onInvoiceCreated={(newInvoice) => {
          refreshAll()
          setReceiptModal({ isOpen: true, invoice: newInvoice })
        }}
      />

      <RecordPaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, invoice: null })}
        invoice={paymentModal.invoice}
        openInvoices={openInvoicesList}
        onPaymentRecorded={ async (payment) => {
          refreshAll()
          try {
            const updatedInv = await billingApi.getInvoiceById(payment.invoiceId)
            setReceiptModal({ isOpen: true, invoice: updatedInv })
          } catch (_) {}
        }}
      />

      <InvoiceReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal({ isOpen: false, invoice: null })}
        invoice={receiptModal.invoice}
        onOpenPaymentModal={(inv) => setPaymentModal({ isOpen: true, invoice: inv })}
        onInvoiceUpdated={(updatedInv) => {
          setReceiptModal({ isOpen: true, invoice: updatedInv })
          refreshAll()
        }}
      />

      <AdmissionModal
        isOpen={admissionModalOpen}
        onClose={() => setAdmissionModalOpen(false)}
        onAdmissionCreated={() => {
          refreshAll()
          setActiveTab('admissions')
        }}
      />
    </div>
  )
}

