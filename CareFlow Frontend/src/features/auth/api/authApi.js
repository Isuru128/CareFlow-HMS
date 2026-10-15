import apiClient from '../../../services/api/apiClient'

export const authApi = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  logout: async (refreshToken) => {
    const response = await apiClient.post('/auth/logout', { refreshToken })
    return response.data
  },

  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (data) => {
    const response = await apiClient.post('/auth/reset-password', data)
    return response.data
  },

  changePassword: async (passwords) => {
    const response = await apiClient.post('/auth/change-password', passwords)
    return response.data
  }
}
