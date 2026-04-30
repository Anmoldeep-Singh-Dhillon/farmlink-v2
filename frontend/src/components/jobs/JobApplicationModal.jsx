import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { applyForJob } from '../../api/jobs'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

export default function JobApplicationModal({ job, onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    offeredRate: '',
    rateBasis: 'DAILY',
    coverNote: '',
  })

  const mutation = useMutation({
    mutationFn: (data) => applyForJob(job.id, data),
    onSuccess: () => {
      toast.success('Application sent!')
      queryClient.invalidateQueries(['jobs'])
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to apply'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      offeredRate: form.offeredRate ? parseFloat(form.offeredRate) : undefined,
      rateBasis: form.rateBasis || undefined,
      coverNote: form.coverNote || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Apply for Job</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="px-6 pt-4">
          <p className="text-sm font-medium text-gray-700">{job.title}</p>
          <p className="text-xs text-gray-500 mt-1">{job.serviceNeeded} • {job.workFromDate} → {job.workToDate}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {basis}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Rate (₹) — optional
            </label>
            <input
              type="number"
              value={form.offeredRate}
              onChange={(e) => setForm({ ...form, offeredRate: e.target.value })}
              placeholder={`Amount per ${form.rateBasis === 'DAILY' ? 'day' : 'hour'}`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Note (optional)
            </label>
            <textarea
              value={form.coverNote}
              onChange={(e) => setForm({ ...form, coverNote: e.target.value })}
              placeholder="Tell the farmer about your experience..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Applying...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}