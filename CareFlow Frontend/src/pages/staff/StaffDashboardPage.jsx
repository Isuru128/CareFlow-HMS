import React, { useState, useEffect, useCallback } from 'react'
import { staffApi } from '../../features/staff/api/staffApi'
import {
  StaffStatusBadge,
  RoleCategoryBadge,
  ShiftTypeBadge,
  EmploymentTypeBadge,
  AttendanceStatusBadge,
  AssignmentTypeBadge,
  LeaveTypeBadge,
  LeaveStatusBadge
} from '../../features/staff/components/StaffStatusBadge'
import EmployeeFormModal from '../../features/staff/components/EmployeeFormModal'
import RecordAttendanceModal from '../../features/staff/components/RecordAttendanceModal'
import DepartmentAssignmentModal from '../../features/staff/components/DepartmentAssignmentModal'
import LeaveRequestModal from '../../features/staff/components/LeaveRequestModal'
import EmployeeDetailModal from '../../features/staff/components/EmployeeDetailModal'

import {
  Briefcase,
  UserPlus,
  Users,
  Clock,
  Building2,
  CalendarOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  LogIn,
  LogOut,
  ArrowRightLeft,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronRight,
  DollarSign
} from 'lucide-react'

export default function StaffDashboardPage() {
  // Active View Tab: 'employees' | 'attendance' | 'departments' | 'leaves'
  const [activeTab, setActiveTab] = useState('employees')

  // Dashboard Summary Metrics
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployeesCount: 0,
    onLeaveEmployeesCount: 0,
    inactiveEmployeesCount: 0,
    todayPresentCount: 0,
    todayLateCount: 0,
    todayAbsentCount: 0,
    todayOnLeaveAttendanceCount: 0,
    todayTotalMarkedCount: 0,
    pendingLeaveRequestsCount: 0,
    approvedLeavesCount: 0,
    totalDepartmentsCount: 0,
    totalAssignmentsCount: 0,
    monthlyPayrollTotal: 0,
    nursesCount: 0,
    labStaffCount: 0,
    pharmacistsCount: 0,
    receptionistsCount: 0,
    accountantsCount: 0,
    adminSupportCount: 0
  })

  // Data Collections
  const [employees, setEmployees] = useState([])
  const [allEmployeesList, setAllEmployeesList] = useState([])
  const [departments, setDepartments] = useState([])
  const [attendanceList, setAttendanceList] = useState([])
  const [assignmentsList, setAssignmentsList] = useState([])
  const [leavesList, setLeavesList] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [shiftFilter, setShiftFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('')
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState('ALL')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('ALL')

  // Pagination
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Modals State
  const [employeeModal, setEmployeeModal] = useState({
    isOpen: false,
    employeeToEdit: null
  })
  const [attendanceModal, setAttendanceModal] = useState({
    isOpen: false,
    preselectedEmployee: null,
    existingAttendance: null
  })
  const [assignmentModal, setAssignmentModal] = useState({
    isOpen: false,
    preselectedEmployee: null
  })
  const [leaveModal, setLeaveModal] = useState({
    isOpen: false,
    preselectedEmployee: null
  })
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    employee: null
  })

  // Load KPI Stats
  const loadStats = async () => {
    try {
      const data = await staffApi.getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load staff dashboard stats:', err)
    }
  }

  // Load Reference Lists (All Employees & Departments)
  const loadReferenceLists = async () => {
    try {
      const [emps, depts] = await Promise.all([
        staffApi.getAllEmployeesList().catch(() => []),
        staffApi.getDepartmentsList().catch(() => [])
      ])
      setAllEmployeesList(emps || [])
      setDepartments(depts || [])
    } catch (err) {
      console.error('Failed to load staff reference lists:', err)
    }
  }

  // Load Tab Specific Data
  const loadTabData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeTab === 'employees') {
        const data = await staffApi.searchEmployees({
          query: searchQuery,
          departmentId: departmentFilter,
          roleCategory: roleFilter,
          shiftType: shiftFilter,
          status: statusFilter,
          page,
          size: pageSize
        })
        setEmployees(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      } else if (activeTab === 'attendance') {
        const data = await staffApi.searchAttendance({
          query: searchQuery,
          departmentId: departmentFilter,
          attendanceDate: attendanceDateFilter,
          status: statusFilter,
          shiftType: shiftFilter,
          page,
          size: pageSize
        })
        setAttendanceList(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      } else if (activeTab === 'departments') {
        const data = await staffApi.searchAssignments({
          query: searchQuery,
          departmentId: departmentFilter,
          assignmentType: assignmentTypeFilter,
          page,
          size: pageSize
        })
        setAssignmentsList(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      } else if (activeTab === 'leaves') {
        const data = await staffApi.searchLeaves({
          query: searchQuery,
          departmentId: departmentFilter,
          leaveType: leaveTypeFilter,
          status: statusFilter,
          page,
          size: pageSize
        })
        setLeavesList(data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalElements(data.totalElements || 0)
      }
    } catch (err) {
      console.error('Failed to load staff tab data:', err)
      setError('Unable to load records for the selected staff management view.')
    } finally {
      setLoading(false)
    }
  }, [
    activeTab,
    searchQuery,
    departmentFilter,
    roleFilter,
    shiftFilter,
    statusFilter,
    attendanceDateFilter,
    assignmentTypeFilter,
    leaveTypeFilter,
    page,
    pageSize
  ])

  useEffect(() => {
    loadStats()
    loadReferenceLists()
  }, [])

  useEffect(() => {
    setPage(0)
    setStatusFilter('ALL')
  }, [activeTab, searchQuery, departmentFilter, roleFilter, shiftFilter, attendanceDateFilter, assignmentTypeFilter, leaveTypeFilter])

  useEffect(() => {
    loadTabData()
  }, [loadTabData])

  const refreshAll = () => {
    loadStats()
    loadReferenceLists()
    loadTabData()
  }

  // Quick Check-In Action
  const handleQuickCheckIn = async (emp) => {
    try {
      await staffApi.quickCheckIn(emp.id, `Checked in for ${emp.shiftType} shift`)
      refreshAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record check-in.')
    }
  }

  // Quick Check-Out Action
  const handleQuickCheckOut = async (empId, empName) => {
    try {
      await staffApi.quickCheckOut(empId, `Completed shift duty (${empName})`)
      refreshAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record check-out.')
    }
  }

  // Review Leave Request (Approve / Reject)
  const handleReviewLeave = async (leave, decision) => {
    const defaultNote = decision === 'APPROVED'
      ? 'Approved. Shift coverage verified with department supervisor.'
      : 'Unable to approve due to critical ward staffing requirement.'
    const comments = window.prompt(
      `${decision === 'APPROVED' ? 'Approve' : 'Reject'} ${leave.leaveType} leave request (${leave.leaveNumber}, ${leave.totalDays} days) for ${leave.employeeName}? Enter supervisor comments:`,
      defaultNote
    )
    if (comments !== null) {
      try {
        await staffApi.reviewLeaveRequest(leave.id, {
          status: decision,
          reviewComments: comments
        })
        refreshAll()
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to review leave request.')
      }
    }
  }

  // Compute staff count per department from allEmployeesList
  const getDepartmentStaffCount = (deptId) => {
    return allEmployeesList.filter(e => Number(e.departmentId) === Number(deptId)).length
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header & Quick Action Toolbar */}
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
            background: 'linear-gradient(135deg, #0284c7 0%, #6d28d9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
          }}>
            <Briefcase size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--secondary)', margin: 0, letterSpacing: '-0.01em' }}>
              Hospital Staff & HR Management
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Employee Registration • Daily Shift Attendance • Department Assignments & Leave Records
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
            onClick={() => setAttendanceModal({ isOpen: true, preselectedEmployee: null, existingAttendance: null })}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', borderColor: '#059669', color: '#059669' }}
          >
            <Clock size={16} />
            <span>Mark Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => setAssignmentModal({ isOpen: true, preselectedEmployee: null })}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem' }}
          >
            <ArrowRightLeft size={16} />
            <span>Assign Department</span>
          </button>

          <button
            type="button"
            onClick={() => setLeaveModal({ isOpen: true, preselectedEmployee: null })}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', borderColor: '#6d28d9', color: '#6d28d9' }}
          >
            <CalendarOff size={16} />
            <span>Apply Leave</span>
          </button>

          <button
            type="button"
            onClick={() => setEmployeeModal({ isOpen: true, employeeToEdit: null })}
            className="btn btn-primary"
            style={{ fontSize: '0.82rem', fontWeight: 700 }}
          >
            <UserPlus size={16} />
            <span>Register Employee</span>
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
        {/* 1. Total Registered Staff */}
        <div
          onClick={() => setActiveTab('employees')}
          className="card card-hover"
          style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
        >
          <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Registered Hospital Staff
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--secondary)' }}>
              {stats.totalEmployees || 0} Staff
            </div>
            <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>
              {stats.activeEmployeesCount || 0} Active • {stats.nursesCount || 0} Nurses • {stats.labStaffCount || 0} Lab
            </div>
          </div>
        </div>

        {/* 2. Today's Shift Attendance */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="card card-hover"
          style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
        >
          <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Today's Attendance
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
              {(stats.todayPresentCount || 0) + (stats.todayLateCount || 0)} On Duty
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {stats.todayPresentCount || 0} On-Time • {stats.todayLateCount || 0} Late • {stats.todayAbsentCount || 0} Absent
            </div>
          </div>
        </div>

        {/* 3. Department Assignments */}
        <div
          onClick={() => setActiveTab('departments')}
          className="card card-hover"
          style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
        >
          <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309' }}>
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Department Placements
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706' }}>
              {stats.totalDepartmentsCount || 0} Clinical Depts
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {stats.totalAssignmentsCount || 0} Logged Placement(s)
            </div>
          </div>
        </div>

        {/* 4. Leave Requests & On-Leave Staff */}
        <div
          onClick={() => setActiveTab('leaves')}
          className="card card-hover"
          style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
        >
          <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: '#ede9fe', color: '#6d28d9' }}>
            <CalendarOff size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Leave Applications
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#6d28d9' }}>
              {stats.pendingLeaveRequestsCount || 0} Pending Review
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {stats.onLeaveEmployeesCount || 0} Currently On Leave
            </div>
          </div>
        </div>

        {/* 5. Monthly Payroll Commitment */}
        <div className="card" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: '#fce7f3', color: '#be185d' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Monthly Staff Payroll
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#be185d' }}>
              LKR {Number(stats.monthlyPayrollTotal || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Active & On-Leave Base Salaries
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card with 4 Module 3.9 Tabs */}
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
            { id: 'employees', label: 'Employee Registration & Directory', icon: Users, count: stats.totalEmployees },
            { id: 'attendance', label: 'Daily Attendance & Shift Tracker', icon: Clock, count: stats.todayTotalMarkedCount },
            { id: 'departments', label: 'Department Assignment & Transfers', icon: Building2, count: stats.totalAssignmentsCount },
            { id: 'leaves', label: 'Leave Records & Approvals', icon: CalendarOff, count: stats.pendingLeaveRequestsCount }
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

        {/* Filter & Search Bar */}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', flex: '1 1 380px' }}>
            <div style={{ position: 'relative', minWidth: '250px', flex: '1 1 260px', maxWidth: '380px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem', fontSize: '0.82rem' }}
                placeholder={
                  activeTab === 'employees'
                    ? 'Search EMP-..., name, designation, NIC, or department...'
                    : activeTab === 'attendance'
                    ? 'Search staff name, EMP-..., or department...'
                    : activeTab === 'departments'
                    ? 'Search employee, designation, or department...'
                    : 'Search leave number (LVE-...), employee, or reason...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Department Filter across all tabs */}
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '165px', fontSize: '0.82rem' }}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>

            {activeTab === 'employees' && (
              <>
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '155px', fontSize: '0.82rem' }}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">All Staff Roles</option>
                  <option value="NURSE">Nursing Staff</option>
                  <option value="LABORATORY_STAFF">Laboratory Staff</option>
                  <option value="PHARMACIST">Pharmacists</option>
                  <option value="RECEPTIONIST">Receptionists</option>
                  <option value="ACCOUNTANT">Accountants</option>
                  <option value="DOCTOR">Medical Officers</option>
                  <option value="ADMINISTRATIVE">Administrative</option>
                  <option value="SUPPORT_STAFF">Support Staff</option>
                </select>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '145px', fontSize: '0.82rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="RESIGNED">Resigned</option>
                </select>
              </>
            )}

            {activeTab === 'attendance' && (
              <>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto', fontSize: '0.82rem' }}
                  value={attendanceDateFilter}
                  onChange={(e) => setAttendanceDateFilter(e.target.value)}
                  title="Filter by Attendance Date"
                />
                {attendanceDateFilter && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setAttendanceDateFilter('')}
                  >
                    All Dates
                  </button>
                )}

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '150px', fontSize: '0.82rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Attendance Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late Arrival</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ABSENT">Absent</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </>
            )}

            {activeTab === 'departments' && (
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '175px', fontSize: '0.82rem' }}
                value={assignmentTypeFilter}
                onChange={(e) => setAssignmentTypeFilter(e.target.value)}
              >
                <option value="ALL">All Assignment Actions</option>
                <option value="INITIAL_ASSIGNMENT">Initial Placement</option>
                <option value="TRANSFER">Dept Transfer</option>
                <option value="PROMOTION">Promotion</option>
                <option value="TEMPORARY_ROTATION">Temporary Rotation</option>
                <option value="REASSIGNMENT">Reassignment</option>
              </select>
            )}

            {activeTab === 'leaves' && (
              <>
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '155px', fontSize: '0.82rem' }}
                  value={leaveTypeFilter}
                  onChange={(e) => setLeaveTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Leave Types</option>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Medical / Sick Leave</option>
                  <option value="STUDY">Study / CPD Leave</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                </select>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '150px', fontSize: '0.82rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Leave Statuses</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </>
            )}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{totalElements}</strong> record(s)
          </div>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '1.25rem' }}>
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <RefreshCw size={26} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--primary)' }} />
              <span>Loading hospital staff records...</span>
            </div>
          )}

          {/* ===================================================================
              TAB 1: EMPLOYEE REGISTRATION & DIRECTORY
             =================================================================== */}
          {!loading && activeTab === 'employees' && (
            employees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Users size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>No staff employees found</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Register a new nurse, laboratory technologist, pharmacist, receptionist, or accountant.
                </p>
                <button
                  type="button"
                  onClick={() => setEmployeeModal({ isOpen: true, employeeToEdit: null })}
                  className="btn btn-primary btn-sm"
                >
                  <UserPlus size={15} />
                  <span>Register First Employee</span>
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee ID & Name</th>
                      <th>Role & Designation</th>
                      <th>Assigned Department</th>
                      <th>Shift & Type</th>
                      <th>Today's Attendance</th>
                      <th>Leave Quota Used</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.86rem' }}>
                            {emp.employeeNumber}
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {emp.fullName}
                          </div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                            {emp.contactNumber} • {emp.email}
                          </div>
                        </td>
                        <td>
                          <div style={{ marginBottom: '0.25rem' }}>
                            <RoleCategoryBadge roleCategory={emp.roleCategory} />
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                            {emp.designation}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {emp.departmentName}
                          </div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                            Code: {emp.departmentCode}
                          </div>
                        </td>
                        <td>
                          <div style={{ marginBottom: '0.25rem' }}>
                            <ShiftTypeBadge shiftType={emp.shiftType} />
                          </div>
                          <EmploymentTypeBadge employmentType={emp.employmentType} />
                        </td>
                        <td>
                          {emp.todayAttendanceStatus ? (
                            <div>
                              <AttendanceStatusBadge status={emp.todayAttendanceStatus} />
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                {emp.todayCheckInTime ? `In: ${emp.todayCheckInTime.slice(0, 5)}` : ''}
                                {emp.todayCheckOutTime ? ` • Out: ${emp.todayCheckOutTime.slice(0, 5)}` : ''}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Not Marked Today</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span>Annual: <strong>{emp.annualLeaveUsed || 0}/{emp.annualLeaveQuota || 14}</strong></span>
                            <span>Casual: <strong>{emp.casualLeaveUsed || 0}/{emp.casualLeaveQuota || 7}</strong> • Sick: <strong>{emp.sickLeaveUsed || 0}/{emp.sickLeaveQuota || 7}</strong></span>
                          </div>
                        </td>
                        <td>
                          <StaffStatusBadge status={emp.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {!emp.todayCheckInTime && emp.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handleQuickCheckIn(emp)}
                                className="btn btn-primary btn-sm"
                                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                                title="Quick Check-In for Today's Shift"
                              >
                                <LogIn size={13} />
                                <span>Check In</span>
                              </button>
                            )}

                            {emp.todayCheckInTime && !emp.todayCheckOutTime && (
                              <button
                                type="button"
                                onClick={() => handleQuickCheckOut(emp.id, emp.fullName)}
                                className="btn btn-secondary btn-sm"
                                style={{ borderColor: '#d97706', color: '#b45309' }}
                                title="Quick Check-Out for Today's Shift"
                              >
                                <LogOut size={13} />
                                <span>Check Out</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setDetailModal({ isOpen: true, employee: emp })}
                              className="btn btn-secondary btn-sm"
                              title="View 360° Staff Profile"
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setAssignmentModal({ isOpen: true, preselectedEmployee: emp })}
                              className="btn btn-secondary btn-sm"
                              title="Assign / Transfer Department"
                            >
                              <ArrowRightLeft size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setEmployeeModal({ isOpen: true, employeeToEdit: emp })}
                              className="btn btn-secondary btn-sm"
                              title="Edit Employee Profile"
                            >
                              <Edit3 size={14} />
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

          {/* ===================================================================
              TAB 2: DAILY ATTENDANCE & SHIFT TRACKER
             =================================================================== */}
          {!loading && activeTab === 'attendance' && (
            attendanceList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Clock size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>No attendance logs found</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Record daily check-in, check-out, and shift attendance for hospital employees.
                </p>
                <button
                  type="button"
                  onClick={() => setAttendanceModal({ isOpen: true, preselectedEmployee: null, existingAttendance: null })}
                  className="btn btn-primary btn-sm"
                >
                  <Clock size={15} />
                  <span>Mark Attendance</span>
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Employee</th>
                      <th>Department & Role</th>
                      <th>Shift</th>
                      <th>Check-In / Check-Out</th>
                      <th>Worked & Overtime</th>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceList.map(att => (
                      <tr key={att.id}>
                        <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                          {att.attendanceDate}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {att.employeeName}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 700 }}>
                            {att.employeeNumber}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{att.departmentName}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{att.designation}</div>
                        </td>
                        <td>
                          <ShiftTypeBadge shiftType={att.shiftType} />
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                            {att.checkInTime ? att.checkInTime.slice(0, 5) : '—'}
                            {' → '}
                            {att.checkOutTime ? att.checkOutTime.slice(0, 5) : (att.checkInTime ? 'On Duty' : '—')}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>
                            {Number(att.workingHours || 0).toFixed(2)} hrs
                          </div>
                          {Number(att.overtimeHours || 0) > 0 && (
                            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                              +{Number(att.overtimeHours).toFixed(2)}h OT
                            </div>
                          )}
                        </td>
                        <td>
                          <AttendanceStatusBadge status={att.status} />
                        </td>
                        <td style={{ maxWidth: '220px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {att.remarks || '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            {att.checkInTime && !att.checkOutTime && (
                              <button
                                type="button"
                                onClick={() => handleQuickCheckOut(att.employeeId, att.employeeName)}
                                className="btn btn-secondary btn-sm"
                                style={{ borderColor: '#d97706', color: '#b45309' }}
                              >
                                <LogOut size={13} />
                                <span>Check Out</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setAttendanceModal({ isOpen: true, preselectedEmployee: null, existingAttendance: att })}
                              className="btn btn-secondary btn-sm"
                              title="Edit Attendance Entry"
                            >
                              <Edit3 size={14} />
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

          {/* ===================================================================
              TAB 3: DEPARTMENT ASSIGNMENTS & TRANSFERS
             =================================================================== */}
          {!loading && activeTab === 'departments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              {/* Department Staffing Distribution Cards */}
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  Active Hospital Department Staffing Overview
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '0.85rem'
                }}>
                  {departments.map(dept => {
                    const staffCount = getDepartmentStaffCount(dept.id)
                    const isSelected = String(departmentFilter) === String(dept.id)
                    return (
                      <div
                        key={dept.id}
                        onClick={() => setDepartmentFilter(isSelected ? 'ALL' : String(dept.id))}
                        className="card card-hover"
                        style={{
                          padding: '0.95rem 1.1rem',
                          cursor: 'pointer',
                          border: isSelected ? '2px solid #0284c7' : '1px solid var(--border)',
                          backgroundColor: isSelected ? '#f0f9ff' : '#ffffff'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            {dept.name}
                          </span>
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            backgroundColor: '#e0f2fe',
                            color: '#0284c7'
                          }}>
                            {dept.code}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          {dept.description || 'Clinical department'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700 }}>
                          <span style={{ color: '#059669' }}>{staffCount} Staff Assigned</span>
                          <span style={{ color: '#6d28d9' }}>{dept.doctorCount || 0} Doctor(s)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Department Assignment & Transfer History Table */}
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  Department Placement, Transfer & Promotion Ledger
                </h3>
                {assignmentsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No department assignment records match the current filter.
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Effective Date</th>
                          <th>Employee</th>
                          <th>Action Type</th>
                          <th>From Department</th>
                          <th>To Department</th>
                          <th>Updated Designation & Shift</th>
                          <th>Reason / Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignmentsList.map(a => (
                          <tr key={a.id}>
                            <td style={{ fontWeight: 800 }}>{a.effectiveDate}</td>
                            <td>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{a.employeeName}</div>
                              <div style={{ fontSize: '0.73rem', color: '#0284c7', fontWeight: 700 }}>{a.employeeNumber}</div>
                            </td>
                            <td>
                              <AssignmentTypeBadge type={a.assignmentType} />
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>
                              {a.fromDepartmentName}
                            </td>
                            <td>
                              <span style={{ fontWeight: 800, color: '#0284c7' }}>
                                {a.toDepartmentName} ({a.toDepartmentCode})
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{a.newDesignation}</div>
                              <div style={{ marginTop: '0.2rem' }}>
                                <ShiftTypeBadge shiftType={a.newShift} />
                              </div>
                            </td>
                            <td style={{ maxWidth: '250px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {a.reason || '—'}
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
              TAB 4: LEAVE RECORDS & APPROVALS
             =================================================================== */}
          {!loading && activeTab === 'leaves' && (
            leavesList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <CalendarOff size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>No leave records found</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Submit a staff leave application or review pending employee leave requests.
                </p>
                <button
                  type="button"
                  onClick={() => setLeaveModal({ isOpen: true, preselectedEmployee: null })}
                  className="btn btn-primary btn-sm"
                >
                  <CalendarOff size={15} />
                  <span>Submit Leave Application</span>
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Leave No.</th>
                      <th>Employee & Dept</th>
                      <th>Leave Type</th>
                      <th>Duration & Dates</th>
                      <th>Reason & Handover Notes</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Supervisor Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leavesList.map(lve => (
                      <tr key={lve.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#6d28d9', fontSize: '0.88rem' }}>
                            {lve.leaveNumber}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {lve.createdAt ? new Date(lve.createdAt).toLocaleDateString() : ''}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {lve.employeeName}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {lve.employeeNumber} • {lve.departmentName}
                          </div>
                        </td>
                        <td>
                          <LeaveTypeBadge leaveType={lve.leaveType} />
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                            {lve.totalDays} Day{lve.totalDays === 1 ? '' : 's'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {lve.startDate} → {lve.endDate}
                          </div>
                        </td>
                        <td style={{ maxWidth: '280px' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {lve.reason}
                          </div>
                          {lve.handoverNotes && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              <strong>Handover:</strong> {lve.handoverNotes}
                            </div>
                          )}
                          {lve.reviewComments && (
                            <div style={{ fontSize: '0.73rem', color: '#0284c7', marginTop: '0.2rem' }}>
                              <strong>Review:</strong> {lve.reviewComments}
                            </div>
                          )}
                        </td>
                        <td>
                          <LeaveStatusBadge status={lve.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {lve.status === 'PENDING' ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() => handleReviewLeave(lve, 'APPROVED')}
                                className="btn btn-primary btn-sm"
                                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                                title="Approve Leave Request"
                              >
                                <CheckCircle2 size={14} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReviewLeave(lve, 'REJECTED')}
                                className="btn btn-danger-outline btn-sm"
                                title="Reject Leave Request"
                              >
                                <XCircle size={14} />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {lve.reviewedByName ? `Reviewed by ${lve.reviewedByName}` : 'Finalized'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Pagination Footer */}
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
        </div>
      </div>

      {/* Modals */}
      <EmployeeFormModal
        isOpen={employeeModal.isOpen}
        onClose={() => setEmployeeModal({ isOpen: false, employeeToEdit: null })}
        onSuccess={refreshAll}
        employeeToEdit={employeeModal.employeeToEdit}
        departments={departments}
      />

      <RecordAttendanceModal
        isOpen={attendanceModal.isOpen}
        onClose={() => setAttendanceModal({ isOpen: false, preselectedEmployee: null, existingAttendance: null })}
        onSuccess={refreshAll}
        employees={allEmployeesList}
        preselectedEmployee={attendanceModal.preselectedEmployee}
        existingAttendance={attendanceModal.existingAttendance}
      />

      <DepartmentAssignmentModal
        isOpen={assignmentModal.isOpen}
        onClose={() => setAssignmentModal({ isOpen: false, preselectedEmployee: null })}
        onSuccess={refreshAll}
        employees={allEmployeesList}
        departments={departments}
        preselectedEmployee={assignmentModal.preselectedEmployee}
      />

      <LeaveRequestModal
        isOpen={leaveModal.isOpen}
        onClose={() => setLeaveModal({ isOpen: false, preselectedEmployee: null })}
        onSuccess={refreshAll}
        employees={allEmployeesList}
        preselectedEmployee={leaveModal.preselectedEmployee}
      />

      <EmployeeDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, employee: null })}
        employee={detailModal.employee}
        onEditEmployee={(emp) => setEmployeeModal({ isOpen: true, employeeToEdit: emp })}
        onAssignDepartment={(emp) => setAssignmentModal({ isOpen: true, preselectedEmployee: emp })}
        onApplyLeave={(emp) => setLeaveModal({ isOpen: true, preselectedEmployee: emp })}
      />
    </div>
  )
}

