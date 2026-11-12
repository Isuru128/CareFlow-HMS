import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  HeartPulse,
  Stethoscope,
  CalendarCheck,
  ClipboardList,
  FlaskConical,
  Pill,
  Receipt,
  Briefcase,
  FileBarChart
} from 'lucide-react'

export default function Sidebar() {
  const { user, isAdmin } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
          <HeartPulse size={28} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', color: '#ffffff', letterSpacing: '0.01em' }}>CareFlow HMS</h2>
          <span style={{ fontSize: '0.7rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Hospital Platform
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/patients"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <HeartPulse size={18} />
          <span>Patient Management</span>
        </NavLink>

        <NavLink
          to="/doctors"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Stethoscope size={18} />
          <span>Doctor Management</span>
        </NavLink>

        <NavLink
          to="/appointments"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <CalendarCheck size={18} />
          <span>Appointments</span>
        </NavLink>

        <NavLink
          to="/emr"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <ClipboardList size={18} />
          <span>Medical Records (EMR)</span>
        </NavLink>

        <NavLink
          to="/laboratory"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FlaskConical size={18} />
          <span>Laboratory</span>
        </NavLink>

        <NavLink
          to="/pharmacy"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Pill size={18} />
          <span>Pharmacy</span>
        </NavLink>

        <NavLink
          to="/billing"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Receipt size={18} />
          <span>Billing & Payments</span>
        </NavLink>

        <NavLink
          to="/staff"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Briefcase size={18} />
          <span>Staff Management</span>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FileBarChart size={18} />
          <span>Reports & Analytics</span>
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>User Management</span>
          </NavLink>
        )}

        <NavLink
          to="/profile"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <UserCheck size={18} />
          <span>My Profile</span>
        </NavLink>
      </nav>
    </aside>
  )
}
