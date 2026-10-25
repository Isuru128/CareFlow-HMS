import apiClient from '../../../services/api/apiClient'

export const doctorApi = {
  // Doctor CRUD & Search
  getDoctors: async ({ query = '', departmentId = '', specialization = '', status = '', page = 0, size = 10 } = {}) => {
    const params = { page, size }
    if (query && query.trim()) params.query = query.trim()
    if (departmentId && departmentId !== 'ALL') params.departmentId = departmentId
    if (specialization && specialization !== 'ALL') params.specialization = specialization
    if (status && status !== 'ALL') params.status = status

    const response = await apiClient.get('/doctors', { params })
    return response.data
  },

  getActiveDoctorsSummary: async () => {
    const response = await apiClient.get('/doctors/summary')
    return response.data
  },

  getSpecializations: async () => {
    const response = await apiClient.get('/doctors/specializations')
    return response.data
  },

  getDoctorStats: async () => {
    const response = await apiClient.get('/doctors/stats')
    return response.data
  },

  getDoctorById: async (id) => {
    const response = await apiClient.get(`/doctors/${id}`)
    return response.data
  },

  getDoctorByNumber: async (doctorNumber) => {
    const response = await apiClient.get(`/doctors/number/${encodeURIComponent(doctorNumber)}`)
    return response.data
  },

  createDoctor: async (doctorData) => {
    const response = await apiClient.post('/doctors', doctorData)
    return response.data
  },

  updateDoctor: async (id, doctorData) => {
    const response = await apiClient.put(`/doctors/${id}`, doctorData)
    return response.data
  },

  updateDoctorStatus: async (id, status) => {
    const response = await apiClient.patch(`/doctors/${id}/status`, null, {
      params: { status }
    })
    return response.data
  },

  assignDepartment: async (id, departmentId) => {
    const response = await apiClient.put(`/doctors/${id}/department/${departmentId}`)
    return response.data
  },

  // Department Management
  getDepartments: async (activeOnly = false) => {
    const params = activeOnly ? { activeOnly: true } : {}
    const response = await apiClient.get('/departments', { params })
    return response.data
  },

  getDepartmentById: async (id) => {
    const response = await apiClient.get(`/departments/${id}`)
    return response.data
  },

  createDepartment: async (deptData) => {
    const response = await apiClient.post('/departments', deptData)
    return response.data
  },

  updateDepartment: async (id, deptData) => {
    const response = await apiClient.put(`/departments/${id}`, deptData)
    return response.data
  },

  deleteDepartment: async (id) => {
    const response = await apiClient.delete(`/departments/${id}`)
    return response.data
  },

  // Schedule Management
  getDoctorSchedules: async (doctorId) => {
    const response = await apiClient.get(`/doctors/${doctorId}/schedules`)
    return response.data
  },

  getAvailableSlots: async (doctorId, date) => {
    const response = await apiClient.get(`/doctors/${doctorId}/schedules/available-slots`, {
      params: { date }
    })
    return response.data
  },

  createDoctorSchedule: async (doctorId, scheduleData) => {
    const response = await apiClient.post(`/doctors/${doctorId}/schedules`, scheduleData)
    return response.data
  },

  updateDoctorSchedule: async (doctorId, scheduleId, scheduleData) => {
    const response = await apiClient.put(`/doctors/${doctorId}/schedules/${scheduleId}`, scheduleData)
    return response.data
  },

  deleteDoctorSchedule: async (doctorId, scheduleId) => {
    const response = await apiClient.delete(`/doctors/${doctorId}/schedules/${scheduleId}`)
    return response.data
  }
}
