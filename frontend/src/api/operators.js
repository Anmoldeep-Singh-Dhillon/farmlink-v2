import api from './axios'

export const getNearbyOperators = (lat, lng, params = {}) =>
  api.get('/operators', { params: { lat, lng, ...params } })

export const getOperatorById = (id) => api.get(`/operators/${id}`)

export const getMyOperatorProfile = () => api.get('/operators/my')

export const createOperatorProfile = (formData) =>
  api.post('/operators', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const sendHireRequest = (operatorId, data) =>
  api.post(`/operators/${operatorId}/hire`, data)

export const getReceivedHireRequests = () =>
  api.get('/operators/requests/received')

export const getSentHireRequests = () =>
  api.get('/operators/requests/sent')

export const acceptHireRequest = (requestId) =>
  api.patch(`/operators/requests/${requestId}/accept`)

export const rejectHireRequest = (requestId) =>
  api.patch(`/operators/requests/${requestId}/reject`)