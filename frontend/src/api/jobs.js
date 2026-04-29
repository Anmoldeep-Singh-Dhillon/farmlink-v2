import api from './axios'

export const getNearbyJobs = (lat, lng, params = {}) =>
  api.get('/jobs', { params: { lat, lng, ...params } })

export const getJobById = (id) => api.get(`/jobs/${id}`)

export const getMyJobs = () => api.get('/jobs/my')

export const createJobPost = (data) => api.post('/jobs', data)

export const applyForJob = (jobId, data) =>
  api.post(`/jobs/${jobId}/apply`, data)

export const getReceivedApplications = () =>
  api.get('/jobs/applications/received')

export const getSentApplications = () =>
  api.get('/jobs/applications/sent')

export const acceptApplication = (applicationId) =>
  api.patch(`/jobs/applications/${applicationId}/accept`)

export const rejectApplication = (applicationId) =>
  api.patch(`/jobs/applications/${applicationId}/reject`)