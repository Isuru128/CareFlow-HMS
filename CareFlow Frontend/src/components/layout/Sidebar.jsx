import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Users, UserCheck, ShieldAlert, HeartPulse, Stethoscope, CalendarCheck, UserRoundCheck, ClipboardList, FlaskConical } from 'lucide-react'

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

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem'
          }}>
            {user?.firstName?.[0] || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {user?.roles?.[0]?.replace('ROLE_', '') || 'STAFF'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
