import React, { useState, useEffect } from 'react'
import { staffApi } from '../api/staffApi'
import {
  StaffStatusBadge,
  RoleCategoryBadge,
  ShiftTypeBadge,
  EmploymentTypeBadge,
  AttendanceStatusBadge,
  AssignmentTypeBadge,
  LeaveTypeBadge,
  LeaveStatusBadge
} from './StaffStatusBadge'
import {
  X,
  UserCheck,
  Building2,
  Clock,
  CalendarOff,
  ArrowRightLeft,
  Phone,
  Mail,
  MapPin,
  Edit3
} from 'lucide-react'

export default function EmployeeDetailModal({
  isOpen,
  onClose,
  employee,
  onEditEmployee,
  onAssignDepartment,
  onApplyLeave
}) {
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [assignmentHistory, setAssignmentHistory] = useState([])
  const [leaveHistory, setLeaveHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && employee?.id) {
      setLoading(true)
      Promise.all([
        staffApi.getEmployeeAttendanceHistory(employee.id).catch(() => []),
        staffApi.getEmployeeAssignments(employee.id).catch(() => []),
        staffApi.getEmployeeLeaves(employee.id).catch(() => [])
      ])
        .then(([att, assign, leaves]) => {
          setAttendanceHistory(att || [])
          setAssignmentHistory(assign || [])
          setLeaveHistory(leaves || [])
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, employee])

  if (!isOpen || !employee) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '880px', width: '96%', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #6d28d9 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.05rem'
            }}>
              {employee.firstName?.[0]}{employee.lastName?.[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  {employee.fullName}
                </h2>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284c7' }}>
                  ({employee.employeeNumber})
                </span>
                <StaffStatusBadge status={employee.status} />
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {employee.designation} • {employee.departmentName} ({employee.departmentCode})
              </p>
            </div>
          </div>

          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Profile & Action Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <RoleCategoryBadge roleCategory={employee.roleCategory} />
              <EmploymentTypeBadge employmentType={employee.employmentType} />
              <ShiftTypeBadge shiftType={employee.shiftType} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose()
                  onAssignDepartment(employee)
                }}
              >
                <ArrowRightLeft size={14} />
                <span>Transfer Dept</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose()
                  onApplyLeave(employee)
                }}
              >
                <CalendarOff size={14} />
                <span>Apply Leave</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose()
                  onEditEmployee(employee)
                }}
              >
                <Edit3 size={14} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Demographics & Employment Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem', margin: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Personal & Contact Details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.83rem' }}>
                <div><strong>NIC / Passport:</strong> {employee.nicOrPassport}</div>
                <div><strong>Gender / DOB:</strong> {employee.gender} {employee.dateOfBirth ? `• ${employee.dateOfBirth}` : ''}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} color="#0284c7" />
                  <span>{employee.contactNumber}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} color="#0284c7" />
                  <span>{employee.email}</span>
                </div>
                {employee.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} color="#0284c7" />
                    <span>{employee.address}</span>
                  </div>
                )}
                {employee.emergencyContactName && (
                  <div style={{ marginTop: '0.25rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--border)', fontSize: '0.78rem' }}>
                    <strong>Emergency:</strong> {employee.emergencyContactName} ({employee.emergencyContactNumber})
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem', margin: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Tenure, Compensation & Leave Quotas
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.83rem' }}>
                <div><strong>Joined Date:</strong> {employee.joinDate || 'N/A'}</div>
                <div><strong>Basic Monthly Salary:</strong> LKR {Number(employee.basicSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div><strong>Qualifications:</strong> {employee.qualification || 'Standard Certification'}</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  marginTop: '0.4rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px dashed var(--border)'
                }}>
                  <div style={{ textAlign: 'center', backgroundColor: '#f0f9ff', padding: '0.35rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 700 }}>ANNUAL</div>
                    <div style={{ fontWeight: 800, color: '#0284c7' }}>
                      {employee.annualLeaveUsed || 0}/{employee.annualLeaveQuota || 14}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', backgroundColor: '#ecfdf5', padding: '0.35rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 700 }}>CASUAL</div>
                    <div style={{ fontWeight: 800, color: '#059669' }}>
                      {employee.casualLeaveUsed || 0}/{employee.casualLeaveQuota || 7}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', backgroundColor: '#fef2f2', padding: '0.35rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#b91c1c', fontWeight: 700 }}>SICK</div>
                    <div style={{ fontWeight: 800, color: '#dc2626' }}>
                      {employee.sickLeaveUsed || 0}/{employee.sickLeaveQuota || 7}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Department Assignment & Transfer History */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={16} color="#0284c7" />
              <span>Department Placement & Transfer History ({assignmentHistory.length})</span>
            </h4>
            {assignmentHistory.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No assignment history found.</div>
            ) : (
              <div className="table-container">
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Effective Date</th>
                      <th>Action</th>
                      <th>From Dept</th>
                      <th>To Dept</th>
                      <th>Designation & Shift</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentHistory.slice(0, 5).map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 700 }}>{a.effectiveDate}</td>
                        <td><AssignmentTypeBadge type={a.assignmentType} /></td>
                        <td>{a.fromDepartmentName}</td>
                        <td style={{ fontWeight: 700, color: '#0284c7' }}>{a.toDepartmentName}</td>
                        <td>{a.newDesignation} ({a.newShift})</td>
                        <td style={{ color: 'var(--text-muted)' }}>{a.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Attendance Logs & Leave History */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} color="#059669" />
                <span>Recent Attendance Logs ({attendanceHistory.length})</span>
              </h4>
              {attendanceHistory.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No attendance records yet.</div>
              ) : (
                <div className="table-container">
                  <table className="data-table" style={{ fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>In / Out</th>
                        <th>Hours</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.slice(0, 5).map(att => (
                        <tr key={att.id}>
                          <td style={{ fontWeight: 700 }}>{att.attendanceDate}</td>
                          <td>
                            {att.checkInTime ? att.checkInTime.slice(0, 5) : '—'} / {att.checkOutTime ? att.checkOutTime.slice(0, 5) : '—'}
                          </td>
                          <td>{Number(att.workingHours || 0).toFixed(1)}h</td>
                          <td><AttendanceStatusBadge status={att.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CalendarOff size={16} color="#6d28d9" />
                <span>Leave Records ({leaveHistory.length})</span>
              </h4>
              {leaveHistory.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No leave requests submitted.</div>
              ) : (
                <div className="table-container">
                  <table className="data-table" style={{ fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th>Leave #</th>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveHistory.slice(0, 5).map(lve => (
                        <tr key={lve.id}>
                          <td style={{ fontWeight: 700 }}>{lve.leaveNumber}</td>
                          <td><LeaveTypeBadge leaveType={lve.leaveType} /></td>
                          <td>{lve.startDate} ({lve.totalDays}d)</td>
                          <td><LeaveStatusBadge status={lve.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

