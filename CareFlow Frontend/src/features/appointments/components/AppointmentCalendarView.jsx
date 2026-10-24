import { useState, useEffect } from 'react'
import { appointmentApi } from '../api/appointmentApi'
import { doctorApi } from '../../doctors/api/doctorApi'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Loader2,
  Clock,
  User,
  Plus
} from 'lucide-react'
import AppointmentStatusBadge from './AppointmentStatusBadge'

export default function AppointmentCalendarView({ onSelectAppointment, onBookOnDate }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [loading, setLoading] = useState(false)

  // Load doctors & departments for filter
  useEffect(() => {
    doctorApi.getActiveDoctorsSummary().then(setDoctors).catch(() => {})
    doctorApi.getDepartments(true).then(setDepartments).catch(() => {})
  }, [])

  // Calculate start & end of current month
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  const startDateStr = firstDayOfMonth.toISOString().split('T')[0]
  const endDateStr = lastDayOfMonth.toISOString().split('T')[0]

  useEffect(() => {
    fetchCalendarData()
  }, [startDateStr, endDateStr, selectedDoctorId, selectedDeptId])

  const fetchCalendarData = async () => {
    setLoading(true)
    try {
      const data = await appointmentApi.getCalendarAppointments({
        startDate: startDateStr,
        endDate: endDateStr,
        doctorId: selectedDoctorId,
        departmentId: selectedDeptId
      })
      setEvents(data || [])
    } catch (err) {
      // Handle silently
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Generate calendar grid dates
  const daysInMonth = lastDayOfMonth.getDate()
  const startDayOfWeek = firstDayOfMonth.getDay() // 0 = Sun, 1 = Mon ...

  const totalGridCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Map events by date (YYYY-MM-DD)
  const eventsByDate = {}
  events.forEach(evt => {
    const dStr = evt.appointmentDate
    if (!eventsByDate[dStr]) {
      eventsByDate[dStr] = []
    }
    eventsByDate[dStr].push(evt)
  })

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Calendar Header Controls */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        background: 'var(--surface-alt)'
      }}>
        {/* Month Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              onClick={handlePrevMonth}
              className="btn btn-icon"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextMonth}
              className="btn btn-icon"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, minWidth: '180px' }}>
            {monthNames[month]} {year}
          </h3>

          <button
            onClick={handleToday}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', fontWeight: 600 }}
          >
            Today
          </button>

          {loading && <Loader2 size={16} className="animate-spin" color="var(--primary)" />}
        </div>

        {/* Doctor and Department Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="form-control"
            style={{ fontSize: '0.825rem', width: 'auto', minWidth: '190px' }}
          >
            <option value="">All Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.fullName} ({d.specialization})
              </option>
            ))}
          </select>

          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="form-control"
            style={{ fontSize: '0.825rem', width: 'auto', minWidth: '160px' }}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekdays Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        textAlign: 'center',
        fontWeight: 700,
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
          <div key={idx} style={{ padding: '0.65rem 0.25rem' }}>
            {day}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        background: 'var(--border)',
        gap: '1px'
      }}>
        {Array.from({ length: totalGridCells }).map((_, index) => {
          const dayNumber = index - startDayOfWeek + 1
          const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth

          if (!isCurrentMonth) {
            return (
              <div
                key={index}
                style={{
                  background: 'var(--surface-alt)',
                  minHeight: '120px',
                  padding: '0.5rem',
                  opacity: 0.35
                }}
              />
            )
          }

          const cellDate = new Date(year, month, dayNumber)
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
          const isToday = dateStr === todayStr
          const dayEvents = eventsByDate[dateStr] || []

          return (
            <div
              key={index}
              style={{
                background: 'var(--surface)',
                minHeight: '125px',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'background 0.15s ease'
              }}
            >
              {/* Day header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: isToday ? 800 : 600,
                  backgroundColor: isToday ? 'var(--primary)' : 'transparent',
                  color: isToday ? '#ffffff' : 'var(--text-main)'
                }}>
                  {dayNumber}
                </span>

                <button
                  type="button"
                  onClick={() => onBookOnDate && onBookOnDate(dateStr)}
                  title={`Book appointment on ${dateStr}`}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-light)',
                    cursor: 'pointer',
                    padding: '2px',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-light)'}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Event items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', maxHeight: '90px' }}>
                {dayEvents.map(evt => {
                  const isCancelled = evt.status === 'CANCELLED'
                  const isCompleted = evt.status === 'COMPLETED'
                  return (
                    <div
                      key={evt.id}
                      onClick={() => onSelectAppointment && onSelectAppointment(evt.id)}
                      style={{
                        padding: '0.2rem 0.35rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.7rem',
                        background: isCancelled ? 'var(--danger-bg)' : isCompleted ? 'var(--success-bg)' : 'var(--primary-light)',
                        color: isCancelled ? 'var(--danger)' : isCompleted ? 'var(--success)' : 'var(--primary)',
                        borderLeft: `3px solid ${isCancelled ? 'var(--danger)' : isCompleted ? 'var(--success)' : 'var(--primary)'}`,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: 600
                      }}
                      title={`${evt.appointmentTime?.substring(0, 5)} - #${evt.queueNumber} ${evt.patientName} (Dr. ${evt.doctorName})`}
                    >
                      <span>{evt.appointmentTime?.substring(0, 5)}</span> • #{evt.queueNumber} {evt.patientName}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
