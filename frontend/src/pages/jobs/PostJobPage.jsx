import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createJobPost, getMyJobs } from '../../api/jobs'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

const SERVICES = ['SEEDING', 'PLOUGHING', 'HARVESTING', 'TRANSPORT', 'LEVELING', 'OTHER']

export default function PostJobPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    serviceNeeded: '',
    desiredRate: '',
    rateBasis: 'DAILY',
    workFromDate: '',
    workToDate: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['myJobs'],
    queryFn: getMyJobs,
  })

  const myJobs = data?.data || []

  const mutation = useMutation({
    mutationFn: createJobPost,
    onSuccess: () => {
      toast.success('Job posted successfully!')
      queryClient.invalidateQueries(['myJobs'])
      setShowForm(false)
      setForm({
        title: '', description: '', serviceNeeded: '',
        desiredRate: '', rateBasis: 'DAILY',
        workFromDate: '', workToDate: '',
      })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to post job'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      title: form.title,
      description: form.description,
      serviceNeeded: form.serviceNeeded,
      desiredRate: form.desiredRate ? parseFloat(form.desiredRate) : undefined,
      rateBasis: form.rateBasis || undefined,
      workFromDate: form.workFromDate,
      workToDate: form.workToDate,
    })
  }

  const statusColor = (status) => {
    if (status === 'ACTIVE') return 'bg-green-100 text-green-700'
    if (status === 'BOOKED') return 'bg-red-100 text-red-600'
    if (status === 'EXPIRED') return 'bg-gray-100 text-gray-500'
    return 'bg-gray-100 text-gray-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Job Posts</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus size={16} />
          Post a Job
        </button>
      </div>

      {isLoading && <div className="text-center py-12 text-gray-500">Loading...</div>}

      {!isLoading && myJobs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No job posts yet</p>
          <p className="text-sm mt-1">Click "Post a Job" to get started</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-800 text-sm">{job.title}</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(job.status)}`}>
                {job.status}
              </span>
            </div>
            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
              {job.serviceNeeded}
            </span>
            {job.desiredRate && (
              <p className="text-xs text-gray-500 mt-2">
                Budget: ₹{job.desiredRate}/{job.rateBasis === 'DAILY' ? 'day' : 'hr'}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {job.workFromDate} → {job.workToDate}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">Post a Job</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Need ploughing for 2 acre field"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the work you need done..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Needed</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, serviceNeeded: s })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        form.serviceNeeded === s
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Basis</label>
                <div className="flex gap-2">
                  {['DAILY', 'HOURLY'].map((basis) => (
                    <button
                      key={basis}
                      type="button"
                      onClick={() => setForm({ ...form, rateBasis: basis })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.rateBasis === basis
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {basis}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desired Rate (₹) — optional
                </label>
                <input
                  type="number"
                  value={form.desiredRate}
                  onChange={(e) => setForm({ ...form, desiredRate: e.target.value })}
                  placeholder={`Your budget per ${form.rateBasis === 'DAILY' ? 'day' : 'hour'}`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work From</label>
                  <input
                    type="date"
                    value={form.workFromDate}
                    onChange={(e) => setForm({ ...form, workFromDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}//addedlater
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Till</label>
                  <input
                    type="date"
                    value={form.workToDate}
                    onChange={(e) => setForm({ ...form, workToDate: e.target.value })}
                    min={form.workFromDate}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {mutation.isPending ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}