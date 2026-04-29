import api from './axios'

export const getNearbyListings = (lat, lng, params = {}) =>
  api.get('/equipment', { params: { lat, lng, ...params } })

export const getListingById = (id) => api.get(`/equipment/${id}`)

export const getMyListings = () => api.get('/equipment/my')

export const createListing = (formData) =>
  api.post('/equipment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const deleteListing = (id) => api.delete(`/equipment/${id}`)

export const sendRentalRequest = (listingId, data) =>
  api.post(`/equipment/${listingId}/request`, data)

export const getReceivedRequests = () => api.get('/equipment/requests/received')

export const getSentRequests = () => api.get('/equipment/requests/sent')

export const acceptRentalRequest = (requestId) =>
  api.patch(`/equipment/requests/${requestId}/accept`)

export const rejectRentalRequest = (requestId) =>
  api.patch(`/equipment/requests/${requestId}/reject`)