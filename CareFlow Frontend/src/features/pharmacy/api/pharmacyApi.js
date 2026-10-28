import apiClient from '../../../services/api/apiClient'

export const pharmacyApi = {
  // Dashboard Stats
  getDashboardStats: async () => {
    const res = await apiClient.get('/pharmacy/dashboard/stats')
    return res.data
  },

  // Medicines (Formulary / Catalog)
  searchMedicines: async ({ query = '', category = '', dosageForm = '', isActive = '', page = 0, size = 15 } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (category && category !== 'ALL') params.append('category', category)
    if (dosageForm && dosageForm !== 'ALL') params.append('dosageForm', dosageForm)
    if (isActive !== '' && isActive !== 'ALL') params.append('isActive', isActive)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'name,asc')

    const res = await apiClient.get(`/pharmacy/medicines?${params.toString()}`)
    return res.data
  },

  getActiveMedicines: async () => {
    const res = await apiClient.get('/pharmacy/medicines/active')
    return res.data
  },

  getLowStockMedicines: async () => {
    const res = await apiClient.get('/pharmacy/medicines/low-stock')
    return res.data
  },

  getMedicineById: async (id) => {
    const res = await apiClient.get(`/pharmacy/medicines/${id}`)
    return res.data
  },

  getMedicineByCode: async (code) => {
    const res = await apiClient.get(`/pharmacy/medicines/code/${code}`)
    return res.data
  },

  createMedicine: async (data) => {
    const res = await apiClient.post('/pharmacy/medicines', data)
    return res.data
  },

  updateMedicine: async (id, data) => {
    const res = await apiClient.put(`/pharmacy/medicines/${id}`, data)
    return res.data
  },

  deleteMedicine: async (id) => {
    const res = await apiClient.delete(`/pharmacy/medicines/${id}`)
    return res.data
  },

  // Batches & Stock Management
  searchBatches: async ({ query = '', medicineId = '', status = '', page = 0, size = 15 } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (medicineId) params.append('medicineId', medicineId)
    if (status && status !== 'ALL') params.append('status', status)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'expiryDate,asc')

    const res = await apiClient.get(`/pharmacy/stock/batches?${params.toString()}`)
    return res.data
  },

  getBatchesByMedicine: async (medicineId) => {
    const res = await apiClient.get(`/pharmacy/stock/batches/medicine/${medicineId}`)
    return res.data
  },

  getAvailableBatches: async (medicineId) => {
    const res = await apiClient.get(`/pharmacy/stock/batches/available/${medicineId}`)
    return res.data
  },

  getBatchById: async (id) => {
    const res = await apiClient.get(`/pharmacy/stock/batches/${id}`)
    return res.data
  },

  createBatch: async (data) => {
    const res = await apiClient.post('/pharmacy/stock/batches', data)
    return res.data
  },

  adjustStock: async (data) => {
    const res = await apiClient.post('/pharmacy/stock/adjust', data)
    return res.data
  },

  updateBatchStatus: async (id, status, notes = '') => {
    const params = new URLSearchParams({ status })
    if (notes) params.append('notes', notes)
    const res = await apiClient.put(`/pharmacy/stock/batches/${id}/status?${params.toString()}`)
    return res.data
  },

  // Expiry Monitoring & Alerts
  getExpiringBatches: async (days = 60) => {
    const res = await apiClient.get(`/pharmacy/stock/alerts/expiring?days=${days}`)
    return res.data
  },

  getExpiredBatches: async () => {
    const res = await apiClient.get('/pharmacy/stock/alerts/expired')
    return res.data
  },

  searchStockTransactions: async ({ query = '', medicineId = '', transactionType = '', page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (medicineId) params.append('medicineId', medicineId)
    if (transactionType && transactionType !== 'ALL') params.append('transactionType', transactionType)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'createdAt,desc')

    const res = await apiClient.get(`/pharmacy/stock/transactions?${params.toString()}`)
    return res.data
  },

  // Dispensations & Prescription Processing
  searchDispensations: async ({ query = '', status = '', paymentStatus = '', page = 0, size = 15 } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (status && status !== 'ALL') params.append('status', status)
    if (paymentStatus && paymentStatus !== 'ALL') params.append('paymentStatus', paymentStatus)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'dispensedAt,desc')

    const res = await apiClient.get(`/pharmacy/dispensations?${params.toString()}`)
    return res.data
  },

  getDispensationById: async (id) => {
    const res = await apiClient.get(`/pharmacy/dispensations/${id}`)
    return res.data
  },

  getDispensationByNumber: async (dispNumber) => {
    const res = await apiClient.get(`/pharmacy/dispensations/number/${dispNumber}`)
    return res.data
  },

  getPendingPrescriptions: async ({ query = '', page = 0, size = 15 } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    params.append('page', page)
    params.append('size', size)
    params.append('sort', 'issueDate,desc')

    const res = await apiClient.get(`/pharmacy/dispensations/pending-prescriptions?${params.toString()}`)
    return res.data
  },

  dispensePrescription: async (data) => {
    const res = await apiClient.post('/pharmacy/dispensations/dispense-prescription', data)
    return res.data
  },

  processDirectSale: async (data) => {
    const res = await apiClient.post('/pharmacy/dispensations/direct-sale', data)
    return res.data
  },

  cancelDispensation: async (id, reason = 'Dispensation cancelled by pharmacist') => {
    const params = new URLSearchParams({ reason })
    const res = await apiClient.put(`/pharmacy/dispensations/${id}/cancel?${params.toString()}`)
    return res.data
  }
}
