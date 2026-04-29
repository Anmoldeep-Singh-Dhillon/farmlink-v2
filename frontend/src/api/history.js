import api from './axios'

export const getMyHistory = () => api.get('/history')

export const getHistoryByType = (type) =>
  api.get('/history/filter', { params: { type } })