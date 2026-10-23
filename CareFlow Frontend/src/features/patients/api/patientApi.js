import apiClient from '../../../services/api/apiClient'

export const patientApi = {
  // Patient CRUD & Search
  getPatients: async ({ query = '', status = '', gender = '', page = 0, size = 10, sort = 'createdAt,desc' } = {}) => {
    const params = { page, size, sort }
    if (query && query.trim()) params.query = query.trim()
    if (status && status !== 'ALL') params.status = status
    if (gender && gender !== 'ALL') params.gender = gender

    const response = await apiClient.get('/patients', { params })
    return response.data
  },

  getPatientStats: async () => {
    const response = await apiClient.get('/patients/stats')
    return response.data
  },

  getPatientById: async (id) => {
    const response = await apiClient.get(`/patients/${id}`)
    return response.data
  },

  getPatientByNumber: async (patientNumber) => {
    const response = await apiClient.get(`/patients/number/${encodeURIComponent(patientNumber)}`)
    return response.data
  },

  createPatient: async (patientData) => {
    const response = await apiClient.post('/patients', patientData)
    return response.data
  },

  updatePatient: async (id, patientData) => {
    const response = await apiClient.put(`/patients/${id}`, patientData)
    return response.data
  },

  updatePatientStatus: async (id, status) => {
    const response = await apiClient.patch(`/patients/${id}/status`, null, {
      params: { status }
    })
    return response.data
  },

  deletePatient: async (id) => {
    const response = await apiClient.delete(`/patients/${id}`)
    return response.data
  },

  // Medical History
  getMedicalHistories: async (patientId) => {
    const response = await apiClient.get(`/patients/${patientId}/medical-history`)
    return response.data
  },

  getMedicalHistoryById: async (patientId, historyId) => {
    const response = await apiClient.get(`/patients/${patientId}/medical-history/${historyId}`)
    return response.data
  },

  addMedicalHistory: async (patientId, historyData) => {
    const response = await apiClient.post(`/patients/${patientId}/medical-history`, historyData)
    return response.data
  },

  updateMedicalHistory: async (patientId, historyId, historyData) => {
    const response = await apiClient.put(`/patients/${patientId}/medical-history/${historyId}`, historyData)
    return response.data
  },

  deleteMedicalHistory: async (patientId, historyId) => {
    const response = await apiClient.delete(`/patients/${patientId}/medical-history/${historyId}`)
    return response.data
  },

  // Patient Documents
  getDocuments: async (patientId, documentType) => {
    const params = {}
    if (documentType && documentType !== 'ALL') {
      params.documentType = documentType
    }
    const response = await apiClient.get(`/patients/${patientId}/documents`, { params })
    return response.data
  },

  getDocumentById: async (patientId, documentId) => {
    const response = await apiClient.get(`/patients/${patientId}/documents/${documentId}`)
    return response.data
  },

  uploadDocument: async (patientId, { file, documentName, documentType, notes }) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentName', documentName)
    formData.append('documentType', documentType)
    if (notes) formData.append('notes', notes)

    const response = await apiClient.post(`/patients/${patientId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  downloadDocument: async (patientId, documentId, fallbackFileName = 'document') => {
    const response = await apiClient.get(`/patients/${patientId}/documents/${documentId}/download`, {
      responseType: 'blob'
    })

    // Extract filename from Content-Disposition if present
    let fileName = fallbackFileName
    const disposition = response.headers['content-disposition']
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const match = disposition.match(/filename="?([^";]+)"?/)
      if (match && match[1]) {
        fileName = match[1]
      }
    }

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = blobUrl
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  },

  deleteDocument: async (patientId, documentId) => {
    const response = await apiClient.delete(`/patients/${patientId}/documents/${documentId}`)
    return response.data
  }
}
