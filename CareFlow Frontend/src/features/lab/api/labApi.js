import apiClient from '../../../services/api/apiClient'

export const labApi = {
  // --- Test Requests ---
  getRequests: async ({
    query = '',
    patientId = '',
    doctorId = '',
    status = '',
    priority = '',
    startDate = '',
    endDate = '',
    page = 0,
    size = 10,
    sort = 'requestedAt,desc'
  } = {}) => {
    const params = { page, size, sort }
    if (query && query.trim()) params.query = query.trim()
    if (patientId && patientId !== 'ALL') params.patientId = patientId
    if (doctorId && doctorId !== 'ALL') params.doctorId = doctorId
    if (status && status !== 'ALL') params.status = status
    if (priority && priority !== 'ALL') params.priority = priority
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const response = await apiClient.get('/lab/requests', { params })
    return response.data
  },

  getRequestById: async (id) => {
    const response = await apiClient.get(`/lab/requests/${id}`)
    return response.data
  },

  getRequestByNumber: async (requestNumber) => {
    const response = await apiClient.get(`/lab/requests/number/${encodeURIComponent(requestNumber)}`)
    return response.data
  },

  getSummaryStats: async () => {
    const response = await apiClient.get('/lab/requests/stats')
    return response.data
  },

  createRequest: async (data) => {
    const response = await apiClient.post('/lab/requests', data)
    return response.data
  },

  cancelRequest: async (id, reason) => {
    const response = await apiClient.put(`/lab/requests/${id}/cancel`, { reason })
    return response.data
  },

  // --- Sample Collection ---
  getSamples: async ({ query = '', status = '', page = 0, size = 15 } = {}) => {
    const params = { page, size }
    if (query && query.trim()) params.query = query.trim()
    if (status && status !== 'ALL') params.status = status

    const response = await apiClient.get('/lab/samples', { params })
    return response.data
  },

  getSamplesByRequestId: async (requestId) => {
    const response = await apiClient.get(`/lab/samples/request/${requestId}`)
    return response.data
  },

  getSampleById: async (id) => {
    const response = await apiClient.get(`/lab/samples/${id}`)
    return response.data
  },

  getSampleByBarcode: async (barcode) => {
    const response = await apiClient.get(`/lab/samples/barcode/${encodeURIComponent(barcode)}`)
    return response.data
  },

  collectSample: async (data) => {
    const response = await apiClient.post('/lab/samples/collect', data)
    return response.data
  },

  updateSampleStatus: async (id, data) => {
    const response = await apiClient.put(`/lab/samples/${id}/status`, data)
    return response.data
  },

  // --- Result Entry ---
  getResultsByItemId: async (requestItemId) => {
    const response = await apiClient.get(`/lab/results/item/${requestItemId}`)
    return response.data
  },

  getResultsByRequestId: async (requestId) => {
    const response = await apiClient.get(`/lab/results/request/${requestId}`)
    return response.data
  },

  enterResults: async (data) => {
    const response = await apiClient.post('/lab/results', data)
    return response.data
  },

  // --- Diagnostic Reports ---
  getReports: async ({ query = '', page = 0, size = 10 } = {}) => {
    const params = { page, size }
    if (query && query.trim()) params.query = query.trim()

    const response = await apiClient.get('/lab/reports', { params })
    return response.data
  },

  getReportById: async (id) => {
    const response = await apiClient.get(`/lab/reports/${id}`)
    return response.data
  },

  getReportByRequestId: async (requestId) => {
    const response = await apiClient.get(`/lab/reports/request/${requestId}`)
    return response.data
  },

  getReportByNumber: async (reportNumber) => {
    const response = await apiClient.get(`/lab/reports/number/${encodeURIComponent(reportNumber)}`)
    return response.data
  },

  generateReport: async (data) => {
    const response = await apiClient.post('/lab/reports', data)
    return response.data
  },

  verifyReport: async (id) => {
    const response = await apiClient.put(`/lab/reports/${id}/verify`)
    return response.data
  },

  // --- Test Catalog ---
  getTests: async ({ query = '', category = '', isActive = '', page = 0, size = 20 } = {}) => {
    const params = { page, size }
    if (query && query.trim()) params.query = query.trim()
    if (category && category !== 'ALL') params.category = category
    if (isActive !== '' && isActive !== 'ALL') params.isActive = isActive

    const response = await apiClient.get('/lab/tests', { params })
    return response.data
  },

  getActiveTests: async () => {
    const response = await apiClient.get('/lab/tests/active')
    return response.data
  },

  getTestById: async (id) => {
    const response = await apiClient.get(`/lab/tests/${id}`)
    return response.data
  },

  createTest: async (data) => {
    const response = await apiClient.post('/lab/tests', data)
    return response.data
  },

  updateTest: async (id, data) => {
    const response = await apiClient.put(`/lab/tests/${id}`, data)
    return response.data
  },

  deleteTest: async (id) => {
    const response = await apiClient.delete(`/lab/tests/${id}`)
    return response.data
  },

  // Reference lookups
  searchPatients: async (query = '') => {
    const params = { size: 50 }
    if (query && query.trim()) params.query = query.trim()
    const response = await apiClient.get('/patients', { params })
    return response.data?.content || []
  },

  getDoctors: async () => {
    const response = await apiClient.get('/doctors', { params: { size: 100 } })
    return response.data?.content || []
  }
}
