import apiClient from '../../../services/api/apiClient'

export const appointmentApi = {
  getAppointments: async ({
    query = '',
    doctorId = '',
    patientId = '',
    departmentId = '',
    status = '',
    startDate = '',
    endDate = '',
    page = 0,
    size = 10,
    sort = 'appointmentDate,desc'
  } = {}) => {
    const params = { page, size, sort }
    if (query && query.trim()) params.query = query.trim()
    if (doctorId && doctorId !== 'ALL') params.doctorId = doctorId
    if (patientId && patientId !== 'ALL') params.patientId = patientId
    if (departmentId && departmentId !== 'ALL') params.departmentId = departmentId
    if (status && status !== 'ALL') params.status = status
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const response = await apiClient.get('/appointments', { params })
    return response.data
  },

  getAppointmentStats: async () => {
    const response = await apiClient.get('/appointments/stats')
    return response.data
  },

  getCalendarAppointments: async ({ doctorId = '', departmentId = '', startDate = '', endDate = '' } = {}) => {
    const params = {}
    if (doctorId && doctorId !== 'ALL') params.doctorId = doctorId
    if (departmentId && departmentId !== 'ALL') params.departmentId = departmentId
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const response = await apiClient.get('/appointments/calendar', { params })
    return response.data
  },

  getAppointmentById: async (id) => {
    const response = await apiClient.get(`/appointments/${id}`)
    return response.data
  },

  getAppointmentByNumber: async (appointmentNumber) => {
    const response = await apiClient.get(`/appointments/number/${encodeURIComponent(appointmentNumber)}`)
    return response.data
  },

  bookAppointment: async (appointmentData) => {
    const response = await apiClient.post('/appointments', appointmentData)
    return response.data
  },

  updateAppointment: async (id, appointmentData) => {
    const response = await apiClient.put(`/appointments/${id}`, appointmentData)
    return response.data
  },

  rescheduleAppointment: async (id, { appointmentDate, appointmentTime, reason }) => {
    const response = await apiClient.put(`/appointments/${id}/reschedule`, {
      appointmentDate,
      appointmentTime,
      reason
    })
    return response.data
  },

  cancelAppointment: async (id, cancellationReason) => {
    const response = await apiClient.put(`/appointments/${id}/cancel`, {
      cancellationReason
    })
    return response.data
  },

  updateAppointmentStatus: async (id, status) => {
    const response = await apiClient.patch(`/appointments/${id}/status`, null, {
      params: { status }
    })
    return response.data
  }
}
