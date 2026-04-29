import api from './axios'

export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const getMyProfile = () => api.get('/users/me')
export const updateMyProfile = (data) => api.patch('/users/me', data)