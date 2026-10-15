import { useState, useEffect } from 'react'
import { userApi } from '../../features/users/api/userApi'
import UserModal from '../../features/users/components/UserModal'
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Search,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [feedback, setFeedback] = useState({ error: '', success: '' })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const fetchUsers = async (page = 0) => {
    setLoading(true)
    setFeedback({ error: '', success: '' })
    try {
      const data = await userApi.getUsers(page, 10)
      setUsers(data.content || [])
      setTotalPages(data.totalPages || 0)
      setCurrentPage(data.number || 0)
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Failed to fetch users from backend server.',
        success: ''
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(0)
  }, [])

  const handleCreateOpen = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const handleEditOpen = (user) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await userApi.updateUserStatus(userId, newStatus)
      setFeedback({ error: '', success: `User status changed to ${newStatus}.` })
      fetchUsers(currentPage)
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Could not update user status.',
        success: ''
      })
    }
  }

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return
    }

    try {
      await userApi.deleteUser(user.id)
      setFeedback({ error: '', success: `User ${user.username} successfully deleted.` })
      fetchUsers(currentPage)
    } catch (err) {
      setFeedback({
        error: err.response?.data?.message || 'Failed to delete user.',
        success: ''
      })
    }
  }

  // Filter users client-side for immediate responsive search
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Quick statistics
  const totalCount = users.length
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length
  const lockedCount = users.filter((u) => u.status === 'LOCKED' || u.status === 'SUSPENDED').length

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge badge-active">ACTIVE</span>
      case 'LOCKED':
        return <span className="badge badge-locked">LOCKED</span>
      case 'SUSPENDED':
        return <span className="badge badge-suspended">SUSPENDED</span>
      default:
        return <span className="badge badge-inactive">{status}</span>
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>User Management</h1>
          <p style={{ fontSize: '0.875rem' }}>Administer system users, credentials, roles, and access controls.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchUsers(currentPage)} title="Refresh list">
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleCreateOpen}>
            <UserPlus size={18} /> Add New User
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback.error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{feedback.error}</span>
        </div>
      )}
      {feedback.success && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{feedback.success}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Registered</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{totalCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', color: 'var(--success)' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Accounts</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{activeCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)', color: '#d97706' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Locked / Suspended</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{lockedCount}</div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-light)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ width: '180px' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOCKED">Locked</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} color="var(--primary)" />
            <p>Loading users from database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No matching users found.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Contact</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>@{user.username}</div>
                  </td>
                  <td>
                    <div>{user.email}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{user.phoneNumber || '—'}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {user.roles?.map((role) => (
                        <span key={role} className="badge badge-role">
                          {role.replace('ROLE_', '')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEditOpen(user)}
                        title="Edit user details"
                      >
                        <Edit2 size={14} />
                      </button>

                      {user.status === 'ACTIVE' ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#d97706' }}
                          onClick={() => handleStatusChange(user.id, 'LOCKED')}
                          title="Lock user account"
                        >
                          <Lock size={14} />
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--success)' }}
                          onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                          title="Activate account"
                        >
                          <Unlock size={14} />
                        </button>
                      )}

                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDeleteUser(user)}
                        title="Delete user"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage === 0}
            onClick={() => fetchUsers(currentPage - 1)}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.85rem' }}>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage >= totalPages - 1}
            onClick={() => fetchUsers(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Modal for Create / Edit */}
      <UserModal
        isOpen={isModalOpen}
        userToEdit={selectedUser}
        onClose={() => setIsModalOpen(false)}
        onUserSaved={() => fetchUsers(currentPage)}
      />
    </div>
  )
}
