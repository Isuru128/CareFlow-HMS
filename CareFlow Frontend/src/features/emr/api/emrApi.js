import apiClient from '../../../services/api/apiClient'

export const emrApi = {
  // --- Medical Records ---
  getMedicalRecords: async ({
    query = '',
    patientId = '',
    doctorId = '',
    status = '',
    startDate = '',
    endDate = '',
    page = 0,
    size = 10,
    sort = 'visitDate,desc'
  } = {}) => {
    const params = { page, size, sort }
    if (query && query.trim()) params.query = query.trim()
    if (patientId && patientId !== 'ALL') params.patientId = patientId
    if (doctorId && doctorId !== 'ALL') params.doctorId = doctorId
    if (status && status !== 'ALL') params.status = status
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const response = await apiClient.get('/emr/records', { params })
    return response.data
  },

  getMedicalRecordById: async (id) => {
    const response = await apiClient.get(`/emr/records/${id}`)
    return response.data
  },

  getMedicalRecordByNumber: async (recordNumber) => {
    const response = await apiClient.get(`/emr/records/number/${encodeURIComponent(recordNumber)}`)
    return response.data
  },

  createMedicalRecord: async (recordData) => {
    const response = await apiClient.post('/emr/records', recordData)
    return response.data
  },

  updateMedicalRecord: async (id, recordData) => {
    const response = await apiClient.put(`/emr/records/${id}`, recordData)
    return response.data
  },

  finalizeMedicalRecord: async (id) => {
    const response = await apiClient.put(`/emr/records/${id}/finalize`)
    return response.data
  },

  deleteMedicalRecord: async (id) => {
    const response = await apiClient.delete(`/emr/records/${id}`)
    return response.data
  },

  getPatientEmrSummary: async (patientId) => {
    const response = await apiClient.get(`/emr/patients/${patientId}/summary`)
    return response.data
  },

  getEmrStats: async () => {
    const response = await apiClient.get('/emr/stats')
    return response.data
  },

  // --- Patient Diagnoses ---
  getDiagnoses: async ({ query = '', patientId = '', status = '', page = 0, size = 10, sort = 'diagnosedDate,desc' } = {}) => {
    const params = { page, size, sort }
    if (query && query.trim()) params.query = query.trim()
    if (patientId && patientId !== 'ALL') params.patientId = patientId
    if (status && status !== 'ALL') params.status = status

    const response = await apiClient.get('/emr/diagnoses', { params })
    return response.data
  },

  getDiagnosesByPatient: async (patientId) => {
    const response = await apiClient.get(`/emr/diagnoses/patient/${patientId}`)
    return response.data
  },

  getDiagnosisById: async (id) => {
    const response = await apiClient.get(`/emr/diagnoses/${id}`)
    return response.data
  },

  addDiagnosis: async (diagnosisData) => {
    const response = await apiClient.post('/emr/diagnoses', diagnosisData)
    return response.data
  },

  updateDiagnosis: async (id, diagnosisData) => {
    const response = await apiClient.put(`/emr/diagnoses/${id}`, diagnosisData)
    return response.data
  },

  resolveDiagnosis: async (id) => {
    const response = await apiClient.put(`/emr/diagnoses/${id}/resolve`)
    return response.data
  },

  deleteDiagnosis: async (id) => {
    const response = await apiClient.delete(`/emr/diagnoses/${id}`)
    return response.data
  },

  // --- Prescriptions ---
  getPrescriptions: async ({ query = '', patientId = '', doctorId = '', status = '', page = 0, size = 10, sort = 'issueDate,desc' } = {}) => {
    const params = { page, size, sort }
    if (query && query.trim()) params.query = query.trim()
    if (patientId && patientId !== 'ALL') params.patientId = patientId
    if (doctorId && doctorId !== 'ALL') params.doctorId = doctorId
    if (status && status !== 'ALL') params.status = status

    const response = await apiClient.get('/emr/prescriptions', { params })
    return response.data
  },

  getPrescriptionsByPatient: async (patientId) => {
    const response = await apiClient.get(`/emr/prescriptions/patient/${patientId}`)
    return response.data
  },

  getPrescriptionById: async (id) => {
    const response = await apiClient.get(`/emr/prescriptions/${id}`)
    return response.data
  },

  getPrescriptionByNumber: async (rxNumber) => {
    const response = await apiClient.get(`/emr/prescriptions/number/${encodeURIComponent(rxNumber)}`)
    return response.data
  },

  createPrescription: async (prescriptionData) => {
    const response = await apiClient.post('/emr/prescriptions', prescriptionData)
    return response.data
  },

  updatePrescription: async (id, prescriptionData) => {
    const response = await apiClient.put(`/emr/prescriptions/${id}`, prescriptionData)
    return response.data
  },

  dispensePrescription: async (id) => {
    const response = await apiClient.put(`/emr/prescriptions/${id}/dispense`)
    return response.data
  },

  cancelPrescription: async (id) => {
    const response = await apiClient.put(`/emr/prescriptions/${id}/cancel`)
    return response.data
  },

  deletePrescription: async (id) => {
    const response = await apiClient.delete(`/emr/prescriptions/${id}`)
    return response.data
  },

  // --- Treatment History ---
  getTreatments: async ({ query = '', patientId = '', category = '', status = '', page = 0, size = 10, sort = 'startDate,desc' } = {}) => {
    const params = { page, size, sort }
    if (query && query.trim()) params.query = query.trim()
    if (patientId && patientId !== 'ALL') params.patientId = patientId
    if (category && category !== 'ALL') params.category = category
    if (status && status !== 'ALL') params.status = status

    const response = await apiClient.get('/emr/treatments', { params })
    return response.data
  },

  getTreatmentsByPatient: async (patientId) => {
    const response = await apiClient.get(`/emr/treatments/patient/${patientId}`)
    return response.data
  },

  getTreatmentById: async (id) => {
    const response = await apiClient.get(`/emr/treatments/${id}`)
    return response.data
  },

  addTreatment: async (treatmentData) => {
    const response = await apiClient.post('/emr/treatments', treatmentData)
    return response.data
  },

  updateTreatment: async (id, treatmentData) => {
    const response = await apiClient.put(`/emr/treatments/${id}`, treatmentData)
    return response.data
  },

  deleteTreatment: async (id) => {
    const response = await apiClient.delete(`/emr/treatments/${id}`)
    return response.data
  },

  // --- Medical Reports ---
  getReports: async ({ query = '', patientId = '', doctorId = '', reportType = '', status = '', page = 0, size = 10, sort = 'reportDate,desc' } = {}) => {
    const params = { page, size, sort }
    if (query && query.trim()) params.query = query.trim()
    if (patientId && patientId !== 'ALL') params.patientId = patientId
    if (doctorId && doctorId !== 'ALL') params.doctorId = doctorId
    if (reportType && reportType !== 'ALL') params.reportType = reportType
    if (status && status !== 'ALL') params.status = status

    const response = await apiClient.get('/emr/reports', { params })
    return response.data
  },

  getReportsByPatient: async (patientId) => {
    const response = await apiClient.get(`/emr/reports/patient/${patientId}`)
    return response.data
  },

  getReportById: async (id) => {
    const response = await apiClient.get(`/emr/reports/${id}`)
    return response.data
  },

  getReportByNumber: async (reportNumber) => {
    const response = await apiClient.get(`/emr/reports/number/${encodeURIComponent(reportNumber)}`)
    return response.data
  },

  createReport: async (reportData) => {
    const response = await apiClient.post('/emr/reports', reportData)
    return response.data
  },

  updateReport: async (id, reportData) => {
    const response = await apiClient.put(`/emr/reports/${id}`, reportData)
    return response.data
  },

  deleteReport: async (id) => {
    const response = await apiClient.delete(`/emr/reports/${id}`)
    return response.data
  }
}
