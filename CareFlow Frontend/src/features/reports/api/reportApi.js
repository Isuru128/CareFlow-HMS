import apiClient from '../../../services/api/apiClient'

export const reportApi = {
  // Consolidated 6-Pillar Live Analytics Overview
  getAnalyticsOverview: async () => {
    const res = await apiClient.get('/reports/analytics/overview')
    return res.data
  },

  // Individual Module 3.10 Live Analytics Endpoints
  getPatientReportAnalytics: async () => {
    const res = await apiClient.get('/reports/analytics/patients')
    return res.data
  },

  getAppointmentReportAnalytics: async () => {
    const res = await apiClient.get('/reports/analytics/appointments')
    return res.data
  },

  getRevenueReportAnalytics: async () => {
    const res = await apiClient.get('/reports/analytics/revenue')
    return res.data
  },

  getPharmacyReportAnalytics: async () => {
    const res = await apiClient.get('/reports/analytics/pharmacy')
    return res.data
  },

  getLaboratoryReportAnalytics: async () => {
    const res = await apiClient.get('/reports/analytics/laboratory')
    return res.data
  },

  getStaffReportAnalytics: async () => {
    const res = await apiClient.get('/reports/analytics/staff')
    return res.data
  },

  // Saved & Generated Reports Registry (hospital_reports table)
  searchSavedReports: async ({
    query = '',
    category = '',
    status = '',
    page = 0,
    size = 12
  } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (category && category !== 'ALL') params.append('category', category)
    if (status && status !== 'ALL') params.append('status', status)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'generatedAt,desc')

    const res = await apiClient.get(`/reports/saved?${params.toString()}`)
    return res.data
  },

  getSavedReportById: async (id) => {
    const res = await apiClient.get(`/reports/saved/${id}`)
    return res.data
  },

  generateAndSaveReport: async (data) => {
    const res = await apiClient.post('/reports/saved', data)
    return res.data
  },

  deleteSavedReport: async (id) => {
    const res = await apiClient.delete(`/reports/saved/${id}`)
    return res.data
  }
}

