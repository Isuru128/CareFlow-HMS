import apiClient from '../../../services/api/apiClient'

export const billingApi = {
  // Dashboard KPI & Revenue Stats
  getDashboardStats: async () => {
    const res = await apiClient.get('/billing/dashboard/stats')
    return res.data
  },

  // Invoices
  searchInvoices: async ({ query = '', patientId = '', status = '', page = 0, size = 12 } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (patientId) params.append('patientId', patientId)
    if (status && status !== 'ALL') params.append('status', status)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'issueDate,desc')

    const res = await apiClient.get(`/billing/invoices?${params.toString()}`)
    return res.data
  },

  getInvoiceById: async (id) => {
    const res = await apiClient.get(`/billing/invoices/${id}`)
    return res.data
  },

  getInvoiceByNumber: async (invoiceNumber) => {
    const res = await apiClient.get(`/billing/invoices/number/${invoiceNumber}`)
    return res.data
  },

  getPatientInvoices: async (patientId) => {
    const res = await apiClient.get(`/billing/patients/${patientId}/invoices`)
    return res.data
  },

  getPatientBillableCharges: async (patientId) => {
    const res = await apiClient.get(`/billing/patients/${patientId}/billable-charges`)
    return res.data
  },

  createInvoice: async (data) => {
    const res = await apiClient.post('/billing/invoices', data)
    return res.data
  },

  addInvoiceItem: async (invoiceId, data) => {
    const res = await apiClient.post(`/billing/invoices/${invoiceId}/items`, data)
    return res.data
  },

  cancelInvoice: async (id, reason = 'Cancelled by billing staff') => {
    const params = new URLSearchParams({ reason })
    const res = await apiClient.put(`/billing/invoices/${id}/cancel?${params.toString()}`)
    return res.data
  },

  // Payments
  searchPayments: async ({ query = '', invoiceId = '', patientId = '', paymentMethod = '', status = '', page = 0, size = 12 } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (invoiceId) params.append('invoiceId', invoiceId)
    if (patientId) params.append('patientId', patientId)
    if (paymentMethod && paymentMethod !== 'ALL') params.append('paymentMethod', paymentMethod)
    if (status && status !== 'ALL') params.append('status', status)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'paymentDate,desc')

    const res = await apiClient.get(`/billing/payments?${params.toString()}`)
    return res.data
  },

  recordPayment: async (invoiceId, data) => {
    const res = await apiClient.post(`/billing/invoices/${invoiceId}/payments`, data)
    return res.data
  },

  refundPayment: async (paymentId, reason = 'Refund processed by accounting') => {
    const params = new URLSearchParams({ reason })
    const res = await apiClient.put(`/billing/payments/${paymentId}/refund?${params.toString()}`)
    return res.data
  },

  // Admissions (Inpatient Stays & Ward Charges)
  searchAdmissions: async ({ query = '', patientId = '', status = '', roomType = '', page = 0, size = 12 } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (patientId) params.append('patientId', patientId)
    if (status && status !== 'ALL') params.append('status', status)
    if (roomType && roomType !== 'ALL') params.append('roomType', roomType)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'admissionDate,desc')

    const res = await apiClient.get(`/billing/admissions?${params.toString()}`)
    return res.data
  },

  getAdmissionById: async (id) => {
    const res = await apiClient.get(`/billing/admissions/${id}`)
    return res.data
  },

  getPatientAdmissions: async (patientId) => {
    const res = await apiClient.get(`/billing/admissions/patient/${patientId}`)
    return res.data
  },

  createAdmission: async (data) => {
    const res = await apiClient.post('/billing/admissions', data)
    return res.data
  },

  dischargeAdmission: async (id, data) => {
    const res = await apiClient.put(`/billing/admissions/${id}/discharge`, data)
    return res.data
  },

  cancelAdmission: async (id, reason = 'Admission cancelled') => {
    const params = new URLSearchParams({ reason })
    const res = await apiClient.put(`/billing/admissions/${id}/cancel?${params.toString()}`)
    return res.data
  },

  // Reference Catalogs for Invoice Generation
  getPatientsList: async () => {
    const res = await apiClient.get('/patients?size=200')
    return res.data?.content || []
  },

  getDoctorsList: async () => {
    const res = await apiClient.get('/doctors?size=100')
    return res.data?.content || []
  },

  getLabTestsCatalog: async () => {
    const res = await apiClient.get('/lab/catalog/active')
    return res.data || []
  },

  getMedicinesCatalog: async () => {
    const res = await apiClient.get('/pharmacy/medicines/active')
    return res.data || []
  }
}

