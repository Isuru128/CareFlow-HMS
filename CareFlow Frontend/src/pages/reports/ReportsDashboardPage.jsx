import React, { useState, useEffect, useCallback } from 'react'
import { reportApi } from '../../features/reports/api/reportApi'
import {
  ReportCategoryBadge,
  ReportStatusBadge,
  MetricProgressBar
} from '../../features/reports/components/ReportCategoryBadge'
import GenerateReportModal from '../../features/reports/components/GenerateReportModal'
import ReportPrintModal from '../../features/reports/components/ReportPrintModal'

import {
  FileBarChart,
  HeartPulse,
  CalendarCheck,
  DollarSign,
  Pill,
  FlaskConical,
  Briefcase,
  Search,
  RefreshCw,
  Plus,
  Printer,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react'

export default function ReportsDashboardPage() {
  // Active View Tab: 'saved' | 'patients' | 'appointments' | 'revenue' | 'pharmacy' | 'laboratory' | 'staff'
  const [activeTab, setActiveTab] = useState('saved')

  // Live 6-Pillar Overview State
  const [overview, setOverview] = useState({
    totalSavedReportsCount: 0,
    patientReport: {
      totalPatients: 0,
      activePatientsCount: 0,
      inactivePatientsCount: 0,
      deceasedPatientsCount: 0,
      malePatientsCount: 0,
      femalePatientsCount: 0,
      totalAdmissionsCount: 0,
      activeAdmissionsCount: 0,
      dischargedAdmissionsCount: 0,
      totalMedicalRecordsCount: 0,
      genderBreakdown: [],
      bloodGroupBreakdown: [],
      statusBreakdown: [],
      admissionRoomTypeBreakdown: []
    },
    appointmentReport: {
      totalAppointments: 0,
      scheduledCount: 0,
      confirmedCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      noShowCount: 0,
      completionRatePercentage: 0,
      cancellationRatePercentage: 0,
      estimatedConsultationValue: 0,
      statusBreakdown: [],
      typeBreakdown: [],
      departmentBreakdown: [],
      doctorWorkloadBreakdown: []
    },
    revenueReport: {
      totalInvoicesCount: 0,
      paidInvoicesCount: 0,
      partiallyPaidInvoicesCount: 0,
      unpaidInvoicesCount: 0,
      totalPaymentsCount: 0,
      totalBilledRevenue: 0,
      totalCollectedRevenue: 0,
      outstandingReceivables: 0,
      totalDiscountsGranted: 0,
      collectionRatePercentage: 0,
      consultationRevenue: 0,
      laboratoryRevenue: 0,
      pharmacyRevenue: 0,
      admissionRevenue: 0,
      procedureAndOtherRevenue: 0,
      chargeCategoryBreakdown: [],
      paymentMethodBreakdown: [],
      invoiceStatusBreakdown: []
    },
    pharmacyReport: {
      totalMedicinesCount: 0,
      activeMedicinesCount: 0,
      totalBatchesCount: 0,
      totalUnitsInStock: 0,
      lowStockMedicinesCount: 0,
      expiringSoonBatchesCount: 0,
      expiredBatchesCount: 0,
      totalDispensationsCount: 0,
      totalDispensationRevenue: 0,
      totalInventoryValuation: 0,
      categoryStockBreakdown: [],
      batchStatusBreakdown: [],
      alertItemsSummary: []
    },
    laboratoryReport: {
      totalCatalogTestsCount: 0,
      totalLabRequestsCount: 0,
      completedRequestsCount: 0,
      pendingRequestsCount: 0,
      totalSamplesCollectedCount: 0,
      finalizedLabReportsCount: 0,
      normalResultsCount: 0,
      abnormalHighLowResultsCount: 0,
      criticalResultsCount: 0,
      estimatedLabTestRevenue: 0,
      testCategoryBreakdown: [],
      requestPriorityBreakdown: [],
      requestStatusBreakdown: [],
      resultFlagBreakdown: []
    },
    staffReport: {
      totalStaffEmployees: 0,
      activeStaffCount: 0,
      onLeaveStaffCount: 0,
      inactiveStaffCount: 0,
      totalDoctorsCount: 0,
      todayPresentCount: 0,
      todayLateCount: 0,
      todayAbsentCount: 0,
      todayOnLeaveCount: 0,
      pendingLeaveRequestsCount: 0,
      approvedLeaveRequestsCount: 0,
      monthlyPayrollCommitment: 0,
      roleCategoryBreakdown: [],
      departmentStaffingBreakdown: [],
      shiftTypeBreakdown: [],
      leaveTypeBreakdown: []
    }
  })

  // Saved Reports Registry State
  const [savedReports, setSavedReports] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Modals State
  const [generateModal, setGenerateModal] = useState({
    isOpen: false,
    preselectedCategory: 'REVENUE_REPORT'
  })
  const [printModal, setPrintModal] = useState({
    isOpen: false,
    report: null
  })

  const loadAnalyticsOverview = useCallback(async () => {
    try {
      const data = await reportApi.getAnalyticsOverview()
      if (data) {
        setOverview(prev => ({ ...prev, ...data }))
      }
    } catch (err) {
      console.error('Failed to load hospital analytics overview:', err)
    }
  }, [])

  const loadSavedReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportApi.searchSavedReports({
        query: searchQuery,
        category: categoryFilter,
        status: statusFilter,
        page,
        size: pageSize
      })
      setSavedReports(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      console.error('Failed to load saved reports:', err)
      setError('Unable to load saved hospital reports.')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, categoryFilter, statusFilter, page, pageSize])

  useEffect(() => {
    loadAnalyticsOverview()
  }, [loadAnalyticsOverview])

  useEffect(() => {
    setPage(0)
  }, [searchQuery, categoryFilter, statusFilter])

  useEffect(() => {
    loadSavedReports()
  }, [loadSavedReports])

  const refreshAll = () => {
    loadAnalyticsOverview()
    loadSavedReports()
  }

  const handleDeleteReport = async (rpt) => {
    if (!window.confirm(`Delete saved report ${rpt.reportNumber} ("${rpt.reportTitle}")?`)) return
    try {
      await reportApi.deleteSavedReport(rpt.id)
      refreshAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report.')
    }
  }

  const openSnapshotGenerator = (category) => {
    setGenerateModal({
      isOpen: true,
      preselectedCategory: category
    })
  }

  const pt = overview.patientReport || {}
  const apt = overview.appointmentReport || {}
  const rev = overview.revenueReport || {}
  const ph = overview.pharmacyReport || {}
  const lab = overview.laboratoryReport || {}
  const stf = overview.staffReport || {}

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header & Action Bar */}
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
            background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
          }}>
            <FileBarChart size={25} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--secondary)', margin: 0, letterSpacing: '-0.01em' }}>
              Hospital Reports & Executive Analytics
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Patient • Appointment • Revenue • Pharmacy • Laboratory & Staff Reports (Module 3.10)
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
            <span>Refresh Live Metrics</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem' }}
          >
            <Printer size={16} />
            <span>Print Active Report</span>
          </button>

          <button
            type="button"
            onClick={() => openSnapshotGenerator('REVENUE_REPORT')}
            className="btn btn-primary"
            style={{ fontSize: '0.82rem', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Generate & Save Report Snapshot</span>
          </button>
        </div>
      </div>

      {/* 6 Pillar KPI Cards (Interactive: Click to switch to any of the 6 Module 3.10 Reports) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))',
        gap: '0.9rem',
        marginBottom: '1.5rem'
      }}>
        {/* 1. Patient Reports */}
        <div
          onClick={() => setActiveTab('patients')}
          className="card card-hover"
          style={{
            padding: '1.05rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'patients' ? '2px solid #0284c7' : undefined
          }}
        >
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <HeartPulse size={21} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              1. Patient Reports
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)' }}>
              {pt.totalPatients || 0} Patients
            </div>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>
              {pt.totalAdmissionsCount || 0} Ward Admissions
            </div>
          </div>
        </div>

        {/* 2. Appointment Reports */}
        <div
          onClick={() => setActiveTab('appointments')}
          className="card card-hover"
          style={{
            padding: '1.05rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'appointments' ? '2px solid #6d28d9' : undefined
          }}
        >
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#ede9fe', color: '#6d28d9' }}>
            <CalendarCheck size={21} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              2. Appointment Reports
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6d28d9' }}>
              {apt.totalAppointments || 0} Bookings
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {apt.completionRatePercentage || 0}% Active/Completed
            </div>
          </div>
        </div>

        {/* 3. Revenue Reports */}
        <div
          onClick={() => setActiveTab('revenue')}
          className="card card-hover"
          style={{
            padding: '1.05rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'revenue' ? '2px solid #059669' : undefined
          }}
        >
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669' }}>
            <DollarSign size={21} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              3. Revenue Reports
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
              LKR {Number(rev.totalBilledRevenue || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {rev.collectionRatePercentage || 0}% Collected
            </div>
          </div>
        </div>

        {/* 4. Pharmacy Reports */}
        <div
          onClick={() => setActiveTab('pharmacy')}
          className="card card-hover"
          style={{
            padding: '1.05rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'pharmacy' ? '2px solid #d97706' : undefined
          }}
        >
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309' }}>
            <Pill size={21} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              4. Pharmacy Reports
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309' }}>
              {ph.totalMedicinesCount || 0} Drugs
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {ph.lowStockMedicinesCount || 0} Low Stock • {ph.expiringSoonBatchesCount || 0} Exp Soon
            </div>
          </div>
        </div>

        {/* 5. Laboratory Reports */}
        <div
          onClick={() => setActiveTab('laboratory')}
          className="card card-hover"
          style={{
            padding: '1.05rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'laboratory' ? '2px solid #be185d' : undefined
          }}
        >
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#fce7f3', color: '#be185d' }}>
            <FlaskConical size={21} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              5. Laboratory Reports
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#be185d' }}>
              {lab.totalLabRequestsCount || 0} Lab Orders
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {lab.abnormalHighLowResultsCount || 0} Abnormal Flag(s)
            </div>
          </div>
        </div>

        {/* 6. Staff Reports */}
        <div
          onClick={() => setActiveTab('staff')}
          className="card card-hover"
          style={{
            padding: '1.05rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'staff' ? '2px solid #3730a3' : undefined
          }}
        >
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
            <Briefcase size={21} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              6. Staff Reports
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3730a3' }}>
              {stf.totalStaffEmployees || 0} Staff
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {(stf.todayPresentCount || 0) + (stf.todayLateCount || 0)} On Duty Today
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card with 7 Tabs */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border)',
          backgroundColor: '#f8fafc',
          padding: '0 0.75rem'
        }}>
          {[
            { id: 'saved', label: 'Saved Reports Registry', icon: FileText, count: overview.totalSavedReportsCount },
            { id: 'patients', label: 'Patient Reports', icon: HeartPulse },
            { id: 'appointments', label: 'Appointment Reports', icon: CalendarCheck },
            { id: 'revenue', label: 'Revenue Reports', icon: DollarSign },
            { id: 'pharmacy', label: 'Pharmacy Reports', icon: Pill },
            { id: 'laboratory', label: 'Laboratory Reports', icon: FlaskConical },
            { id: 'staff', label: 'Staff Reports', icon: Briefcase }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${isActive ? 'active' : ''}`}
                style={{ padding: '0.9rem 1rem', fontSize: '0.82rem' }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    backgroundColor: isActive ? '#e0f2fe' : '#e2e8f0',
                    color: isActive ? '#0284c7' : '#475569',
                    padding: '0.08rem 0.45rem',
                    borderRadius: '999px',
                    fontSize: '0.71rem',
                    fontWeight: 700
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Filter Bar for 'saved' Tab */}
        {activeTab === 'saved' && (
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
              <div style={{ position: 'relative', minWidth: '250px', flex: '1 1 280px', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.25rem', fontSize: '0.82rem' }}
                  placeholder="Search report number (RPT-...), title, department, or summary..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '185px', fontSize: '0.82rem' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All 3.10 Report Categories</option>
                <option value="PATIENT_REPORT">Patient Reports</option>
                <option value="APPOINTMENT_REPORT">Appointment Reports</option>
                <option value="REVENUE_REPORT">Revenue Reports</option>
                <option value="PHARMACY_REPORT">Pharmacy Reports</option>
                <option value="LABORATORY_REPORT">Laboratory Reports</option>
                <option value="STAFF_REPORT">Staff Reports</option>
              </select>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '145px', fontSize: '0.82rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="FINALIZED">Finalized</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing <strong>{totalElements}</strong> saved report(s)
            </div>
          </div>
        )}

        <div style={{ padding: '1.25rem' }}>
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* ===================================================================
              TAB 1: SAVED REPORTS REGISTRY (hospital_reports)
             =================================================================== */}
          {activeTab === 'saved' && (
            loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={26} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--primary)' }} />
                <span>Loading saved hospital reports...</span>
              </div>
            ) : savedReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <FileBarChart size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>No saved reports found</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Generate a new analytical report snapshot for Patient, Appointment, Revenue, Pharmacy, Laboratory, or Staff metrics.
                </p>
                <button
                  type="button"
                  onClick={() => openSnapshotGenerator('REVENUE_REPORT')}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  <span>Generate First Report</span>
                </button>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Report No.</th>
                        <th>Title & Executive Summary</th>
                        <th>Category</th>
                        <th>Period & Scope</th>
                        <th>Primary KPI Metric</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedReports.map(rpt => (
                        <tr key={rpt.id}>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.88rem' }}>
                              {rpt.reportNumber}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {rpt.generatedAt ? new Date(rpt.generatedAt).toLocaleDateString() : ''}
                            </div>
                          </td>
                          <td style={{ maxWidth: '340px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                              {rpt.reportTitle}
                            </div>
                            <div style={{
                              fontSize: '0.76rem',
                              color: 'var(--text-muted)',
                              marginTop: '0.2rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {rpt.executiveSummary}
                            </div>
                          </td>
                          <td>
                            <ReportCategoryBadge category={rpt.reportCategory} />
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                              {rpt.departmentName}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                              {rpt.periodStart} → {rpt.periodEnd}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {rpt.primaryMetricLabel}
                            </div>
                            <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.84rem' }}>
                              {rpt.primaryMetricValue}
                            </div>
                          </td>
                          <td>
                            <ReportStatusBadge status={rpt.status} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() => setPrintModal({ isOpen: true, report: rpt })}
                                className="btn btn-secondary btn-sm"
                                title="View & Print Formal Report"
                              >
                                <Printer size={14} />
                                <span>View / Print</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReport(rpt)}
                                className="btn btn-danger-outline btn-sm"
                                title="Delete Saved Report"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={page === 0}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                      >
                        <ChevronLeft size={15} />
                        <span>Previous</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                      >
                        <span>Next</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          )}

          {/* ===================================================================
              TAB 2: PATIENT REPORTS (3.10.1)
             =================================================================== */}
          {activeTab === 'patients' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800 }}>
                    3.10.1 Patient Demographics, Registration & Inpatient Admission Report
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Real-time patient cohort distribution by gender, blood group, status, and inpatient ward stays
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openSnapshotGenerator('PATIENT_REPORT')}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  <span>Save Patient Report Snapshot</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL REGISTERED PATIENTS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>{pt.totalPatients || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#059669' }}>{pt.activePatientsCount || 0} Active Cohort</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>GENDER DISTRIBUTION</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{pt.malePatientsCount || 0} M / {pt.femalePatientsCount || 0} F</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Other: {pt.otherGenderCount || 0}</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>INPATIENT ADMISSIONS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6d28d9' }}>{pt.totalAdmissionsCount || 0} Stays</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pt.activeAdmissionsCount || 0} Admitted • {pt.dischargedAdmissionsCount || 0} Discharged</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>ELECTRONIC MEDICAL RECORDS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{pt.totalMedicalRecordsCount || 0} EMRs</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clinical consultation files</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.65rem' }}>Gender & Status Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(pt.genderBreakdown || []).map(item => (
                      <MetricProgressBar
                        key={item.key}
                        label={item.label}
                        count={`${item.count} Patient(s)`}
                        percentage={item.percentage}
                        secondaryInfo={item.secondaryInfo}
                        color="#0284c7"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.65rem' }}>Blood Group Distribution</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(pt.bloodGroupBreakdown || []).map(item => (
                      <MetricProgressBar
                        key={item.key}
                        label={item.label}
                        count={`${item.count} Patient(s)`}
                        percentage={item.percentage}
                        secondaryInfo={item.secondaryInfo}
                        color="#dc2626"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 3: APPOINTMENT REPORTS (3.10.2)
             =================================================================== */}
          {activeTab === 'appointments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800 }}>
                    3.10.2 Outpatient Appointment Scheduling & Doctor Workload Report
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Clinic booking status, visit types, department demand, and specialist consultation workload
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openSnapshotGenerator('APPOINTMENT_REPORT')}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  <span>Save Appointment Report Snapshot</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL APPOINTMENTS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6d28d9' }}>{apt.totalAppointments || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scheduled & Walk-in Queue</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>FULFILLMENT / ACTIVE RATE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{apt.completionRatePercentage || 0}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed: {apt.completedCount || 0} • Active: {(apt.scheduledCount || 0) + (apt.confirmedCount || 0)}</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>CANCELLATION / NO-SHOW</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>{apt.cancellationRatePercentage || 0}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cancelled: {apt.cancelledCount || 0} • No-Show: {apt.noShowCount || 0}</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>EST. CONSULTATION VALUE</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0284c7' }}>
                    LKR {Number(apt.estimatedConsultationValue || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active specialist bookings</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.65rem' }}>Appointment Status Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(apt.statusBreakdown || []).map(item => (
                      <MetricProgressBar
                        key={item.key}
                        label={item.label}
                        count={`${item.count} Booking(s)`}
                        percentage={item.percentage}
                        secondaryInfo={item.secondaryInfo}
                        color="#6d28d9"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.65rem' }}>Specialist Doctor Workload & Revenue</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(apt.doctorWorkloadBreakdown || []).map(item => (
                      <MetricProgressBar
                        key={item.key}
                        label={item.label}
                        count={`${item.count} Appt(s) • LKR ${Number(item.amount || 0).toLocaleString()}`}
                        percentage={item.percentage}
                        secondaryInfo={item.secondaryInfo}
                        color="#0284c7"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 4: REVENUE REPORTS (3.10.3)
             =================================================================== */}
          {activeTab === 'revenue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800 }}>
                    3.10.3 Hospital Financial Revenue, Collections & Charge Category Report
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Consolidated revenue analytics across Consultation, Laboratory, Pharmacy, and Inpatient Admission charges
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openSnapshotGenerator('REVENUE_REPORT')}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  <span>Save Revenue Report Snapshot</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>GROSS BILLED REVENUE</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0284c7' }}>
                    LKR {Number(rev.totalBilledRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rev.totalInvoicesCount || 0} Total Invoice(s)</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL COLLECTED RECEIPTS</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>
                    LKR {Number(rev.totalCollectedRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Collection Rate: {rev.collectionRatePercentage || 0}%</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>OUTSTANDING RECEIVABLES</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#d97706' }}>
                    LKR {Number(rev.outstandingReceivables || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {(rev.partiallyPaidInvoicesCount || 0) + (rev.unpaidInvoicesCount || 0)} Open/Partial Bill(s)
                  </div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>DISCOUNTS GRANTED</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#6d28d9' }}>
                    LKR {Number(rev.totalDiscountsGranted || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rev.totalPaymentsCount || 0} Payment Receipt(s)</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.65rem' }}>
                    Revenue Breakdown by Hospital Charge Category
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(rev.chargeCategoryBreakdown || []).map(item => (
                      <MetricProgressBar
                        key={item.key}
                        label={item.label}
                        amount={item.amount}
                        percentage={item.percentage}
                        secondaryInfo={item.secondaryInfo}
                        color="#059669"
                        showCurrency
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.65rem' }}>
                    Collections by Payment Method
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(rev.paymentMethodBreakdown || []).map(item => (
                      <MetricProgressBar
                        key={item.key}
                        label={item.label}
                        amount={item.amount}
                        percentage={item.percentage}
                        secondaryInfo={item.secondaryInfo}
                        color="#0284c7"
                        showCurrency
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 5: PHARMACY REPORTS (3.10.4)
             =================================================================== */}
          {activeTab === 'pharmacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800 }}>
                    3.10.4 Pharmacy Formulary Stock Valuation, FEFO Expiry & Dispensing Report
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Drug inventory valuation, batch expiry risk tracking, reorder alerts, and dispensing revenue
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openSnapshotGenerator('PHARMACY_REPORT')}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  <span>Save Pharmacy Report Snapshot</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTIVE FORMULARY & STOCK</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7' }}>
                    {ph.totalUnitsInStock || 0} Units
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {ph.activeMedicinesCount || 0} Drugs • {ph.totalBatchesCount || 0} Batches
                  </div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>INVENTORY RETAIL VALUATION</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>
                    LKR {Number(ph.totalInventoryValuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Dispensed Sales: LKR {Number(ph.totalDispensationRevenue || 0).toLocaleString()}
                  </div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>LOW STOCK REORDER ALERTS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706' }}>
                    {ph.lowStockMedicinesCount || 0} Drug(s)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>At or below reorder threshold</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>FEFO EXPIRY MONITORING</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626' }}>
                    {ph.expiringSoonBatchesCount || 0} Exp Soon / {ph.expiredBatchesCount || 0} Expired
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>60-day FEFO alert window</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.65rem' }}>Batch Health & Expiry Status</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(ph.batchStatusBreakdown || []).map(item => (
                      <MetricProgressBar
                        key={item.key}
                        label={item.label}
                        count={`${item.count} Batch(es)`}
                        percentage={item.percentage}
                        secondaryInfo={item.secondaryInfo}
                        color={item.key === 'EXPIRED' ? '#dc2626' : item.key === 'EXPIRING_SOON' ? '#d97706' : '#059669'}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.65rem' }}>Low-Stock Reorder Watchlist</h4>
                  {(ph.alertItemsSummary || []).length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>All formulary medicines are above reorder threshold.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      {(ph.alertItemsSummary || []).map(item => (
                        <div
                          key={item.key}
                          style={{
                            padding: '0.7rem 0.9rem',
                            borderRadius: '8px',
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#92400e' }}>{item.label}</div>
                            <div style={{ fontSize: '0.73rem', color: '#b45309' }}>{item.key} • {item.secondaryInfo}</div>
                          </div>
                          <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.88rem' }}>
                            {item.count} Left
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 6: LABORATORY REPORTS (3.10.5)
             =================================================================== */}
          {activeTab === 'laboratory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800 }}>
                    3.10.5 Diagnostic Laboratory Volume, Turnaround & Abnormal Flag Report
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Pathology test requests, barcoded sample collection, verified reports, and abnormal result flags
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openSnapshotGenerator('LABORATORY_REPORT')}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  <span>Save Laboratory Report Snapshot</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>DIAGNOSTIC TEST REQUESTS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#be185d' }}>{lab.totalLabRequestsCount || 0} Orders</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {lab.completedRequestsCount || 0} Completed • {lab.pendingRequestsCount || 0} In Queue
                  </div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>SAMPLES & VERIFIED REPORTS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7' }}>
                    {lab.totalSamplesCollectedCount || 0} Samples / {lab.finalizedLabReportsCount || 0} Reports
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Catalog: {lab.totalCatalogTestsCount || 0} Diagnostic Assays
                  </div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>ABNORMAL / CRITICAL FLAGS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626' }}>
                    {(lab.abnormalHighLowResultsCount || 0) + (lab.criticalResultsCount || 0)} Flagged
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {lab.normalResultsCount || 0} Normal Parameters
                  </div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>EST. DIAGNOSTIC VALUE</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>
                    LKR {Number(lab.estimatedLabTestRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ordered test panel value</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.65rem' }}>Result Parameter Flag Distribution</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(lab.resultFlagBreakdown || []).map(item => (
                      <MetricProgressBar
                        key={item.key}
                        label={item.label}
                        count={`${item.count} Parameter(s)`}
                        percentage={item.percentage}
                        secondaryInfo={item.secondaryInfo}
                        color={item.key === 'NORMAL' ? '#059669' : '#dc2626'}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.65rem' }}>Diagnostic Test Catalog by Department</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(lab.testCategoryBreakdown || []).map(item => (
                      <MetricProgressBar
                        key={item.key}
                        label={item.label}
                        count={`${item.count} Assay(s)`}
                        percentage={item.percentage}
                        secondaryInfo={item.secondaryInfo}
                        color="#be185d"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 7: STAFF REPORTS (3.10.6)
             =================================================================== */}
          {activeTab === 'staff' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800 }}>
                    3.10.6 Human Resources Staffing, Shift Attendance & Payroll Report
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Employee role distribution, department headcount, daily shift attendance, and leave utilization
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openSnapshotGenerator('STAFF_REPORT')}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  <span>Save Staff Report Snapshot</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>HOSPITAL WORKFORCE</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#3730a3' }}>
                    {stf.totalStaffEmployees || 0} Staff + {stf.totalDoctorsCount || 0} Doctors
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669' }}>
                    {stf.activeStaffCount || 0} Active • {stf.onLeaveStaffCount || 0} On Leave
                  </div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>TODAY'S SHIFT ATTENDANCE</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
                    {(stf.todayPresentCount || 0) + (stf.todayLateCount || 0)} On Duty
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {stf.todayPresentCount || 0} On-Time • {stf.todayLateCount || 0} Late • {stf.todayOnLeaveCount || 0} Leave
                  </div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>LEAVE APPLICATIONS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#6d28d9' }}>
                    {stf.approvedLeaveRequestsCount || 0} Approved / {stf.pendingLeaveRequestsCount || 0} Pending
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supervisor leave registry</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>MONTHLY BASE PAYROLL</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#be185d' }}>
                    LKR {Number(stf.monthlyPayrollCommitment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active & on-leave staff</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.65rem' }}>Workforce by Role Category & Payroll</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(stf.roleCategoryBreakdown || []).map(item => (
                      <MetricProgressBar
                        key={item.key}
                        label={item.label}
                        count={`${item.count} Staff`}
                        percentage={item.percentage}
                        secondaryInfo={item.secondaryInfo}
                        color="#3730a3"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.65rem' }}>Departmental Staffing & Specialist Allocation</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(stf.departmentStaffingBreakdown || []).map(item => (
                      <MetricProgressBar
                        key={item.key}
                        label={item.label}
                        count={`${item.count} Staff`}
                        percentage={item.percentage}
                        secondaryInfo={item.secondaryInfo}
                        color="#0284c7"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <GenerateReportModal
        isOpen={generateModal.isOpen}
        onClose={() => setGenerateModal({ isOpen: false, preselectedCategory: 'REVENUE_REPORT' })}
        onSuccess={refreshAll}
        preselectedCategory={generateModal.preselectedCategory}
      />

      <ReportPrintModal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal({ isOpen: false, report: null })}
        report={printModal.report}
      />
    </div>
  )
}

