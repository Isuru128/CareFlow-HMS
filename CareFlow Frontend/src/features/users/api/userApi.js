import apiClient from '../../../services/api/apiClient'

export const userApi = {
  getUsers: async (page = 0, size = 10) => {
    const response = await apiClient.get('/users', {
      params: { page, size, sort: 'createdAt,desc' }
    })
    return response.data
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/users/profile/me')
    return response.data
  },

  createUser: async (userData) => {
    const response = await apiClient.post('/users', userData)
    return response.data
  },

  updateUser: async (id, userData) => {
    const response = await apiClient.put(`/users/${id}`, userData)
    return response.data
  },

  updateUserStatus: async (id, status) => {
    const response = await apiClient.patch(`/users/${id}/status`, null, {
      params: { status }
    })
    return response.data
  },

  deleteUser: async (id) => {
    const response = await apiClient.delete(`/users/${id}`)
    return response.data
  }
}
