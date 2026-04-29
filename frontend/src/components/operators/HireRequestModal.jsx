import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendHireRequest } from '../../api/operators'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

export default function HireRequestModal({ operator, onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    fromDate: '',
    toDate: '',
    offeredRate: '',
    rateBasis: 'DAILY',
    description: '',
  })

  const mutation = useMutation({
    mutationFn: (data) => sendHireRequest(operator.id, data),
    onSuccess: () => {
      toast.success('Hire request sent!')
      queryClient.invalidateQueries(['operators'])
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send request'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      fromDate: form.fromDate,
      toDate: form.toDate,
      offeredRate: parseFloat(form.offeredRate),
      rateBasis: form.rateBasis,
      description: form.description || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Hire — {operator.user?.fullName}
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={form.toDate}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                min={form.fromDate}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
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
              Your Offered Rate (₹)
            </label>
            <input
              type="number"
              value={form.offeredRate}
              onChange={(e) => setForm({ ...form, offeredRate: e.target.value })}
              placeholder={`Amount per ${form.rateBasis === 'DAILY' ? 'day' : 'hour'}`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the work you need done..."
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
              {mutation.isPending ? 'Sending...' : 'Send Hire Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}