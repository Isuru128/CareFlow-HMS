import apiClient from '../../../services/api/apiClient'

export const staffApi = {
  // Dashboard KPI Stats
  getDashboardStats: async () => {
    const res = await apiClient.get('/staff/dashboard/stats')
    return res.data
  },

  // 1. Employees Directory & Registration
  searchEmployees: async ({
    query = '',
    departmentId = '',
    roleCategory = '',
    employmentType = '',
    shiftType = '',
    status = '',
    page = 0,
    size = 12
  } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (departmentId && departmentId !== 'ALL') params.append('departmentId', departmentId)
    if (roleCategory && roleCategory !== 'ALL') params.append('roleCategory', roleCategory)
    if (employmentType && employmentType !== 'ALL') params.append('employmentType', employmentType)
    if (shiftType && shiftType !== 'ALL') params.append('shiftType', shiftType)
    if (status && status !== 'ALL') params.append('status', status)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'createdAt,desc')

    const res = await apiClient.get(`/staff/employees?${params.toString()}`)
    return res.data
  },

  getAllEmployeesList: async () => {
    const res = await apiClient.get('/staff/employees/list')
    return res.data || []
  },

  getEmployeeById: async (id) => {
    const res = await apiClient.get(`/staff/employees/${id}`)
    return res.data
  },

  registerEmployee: async (data) => {
    const res = await apiClient.post('/staff/employees', data)
    return res.data
  },

  updateEmployee: async (id, data) => {
    const res = await apiClient.put(`/staff/employees/${id}`, data)
    return res.data
  },

  // 2. Attendance Management
  searchAttendance: async ({
    query = '',
    employeeId = '',
    departmentId = '',
    attendanceDate = '',
    status = '',
    shiftType = '',
    page = 0,
    size = 12
  } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (employeeId) params.append('employeeId', employeeId)
    if (departmentId && departmentId !== 'ALL') params.append('departmentId', departmentId)
    if (attendanceDate) params.append('attendanceDate', attendanceDate)
    if (status && status !== 'ALL') params.append('status', status)
    if (shiftType && shiftType !== 'ALL') params.append('shiftType', shiftType)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'attendanceDate,desc')

    const res = await apiClient.get(`/staff/attendance?${params.toString()}`)
    return res.data
  },

  getEmployeeAttendanceHistory: async (employeeId) => {
    const res = await apiClient.get(`/staff/employees/${employeeId}/attendance`)
    return res.data || []
  },

  recordOrUpdateAttendance: async (data) => {
    const res = await apiClient.post('/staff/attendance', data)
    return res.data
  },

  quickCheckIn: async (employeeId, remarks = '') => {
    const params = new URLSearchParams()
    if (remarks) params.append('remarks', remarks)
    const res = await apiClient.post(`/staff/employees/${employeeId}/check-in?${params.toString()}`)
    return res.data
  },

  quickCheckOut: async (employeeId, remarks = '') => {
    const params = new URLSearchParams()
    if (remarks) params.append('remarks', remarks)
    const res = await apiClient.post(`/staff/employees/${employeeId}/check-out?${params.toString()}`)
    return res.data
  },

  // 3. Department Assignments & Transfers
  searchAssignments: async ({
    query = '',
    employeeId = '',
    departmentId = '',
    assignmentType = '',
    page = 0,
    size = 12
  } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (employeeId) params.append('employeeId', employeeId)
    if (departmentId && departmentId !== 'ALL') params.append('departmentId', departmentId)
    if (assignmentType && assignmentType !== 'ALL') params.append('assignmentType', assignmentType)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'effectiveDate,desc')

    const res = await apiClient.get(`/staff/department-assignments?${params.toString()}`)
    return res.data
  },

  getEmployeeAssignments: async (employeeId) => {
    const res = await apiClient.get(`/staff/employees/${employeeId}/department-assignments`)
    return res.data || []
  },

  assignDepartment: async (data) => {
    const res = await apiClient.post('/staff/department-assignments', data)
    return res.data
  },

  // 4. Leave Records & Approvals
  searchLeaves: async ({
    query = '',
    employeeId = '',
    departmentId = '',
    leaveType = '',
    status = '',
    page = 0,
    size = 12
  } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (employeeId) params.append('employeeId', employeeId)
    if (departmentId && departmentId !== 'ALL') params.append('departmentId', departmentId)
    if (leaveType && leaveType !== 'ALL') params.append('leaveType', leaveType)
    if (status && status !== 'ALL') params.append('status', status)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'createdAt,desc')

    const res = await apiClient.get(`/staff/leaves?${params.toString()}`)
    return res.data
  },

  getEmployeeLeaves: async (employeeId) => {
    const res = await apiClient.get(`/staff/employees/${employeeId}/leaves`)
    return res.data || []
  },

  createLeaveRequest: async (data) => {
    const res = await apiClient.post('/staff/leaves', data)
    return res.data
  },

  reviewLeaveRequest: async (leaveId, data) => {
    const res = await apiClient.put(`/staff/leaves/${leaveId}/review`, data)
    return res.data
  },

  // Reference Departments Catalog
  getDepartmentsList: async () => {
    const res = await apiClient.get('/departments')
    return res.data || []
  }
}

