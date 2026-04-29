import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendRentalRequest } from '../../api/equipment'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

export default function RentalRequestModal({ listing, onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    rentalBasis: listing.rentalBasis === 'DAILY' ? 'DAILY' :
                 listing.rentalBasis === 'HOURLY' ? 'HOURLY' : 'DAILY',
    fromDate: '',
    toDate: '',
    numHours: '',
    description: '',
  })

  const mutation = useMutation({
    mutationFn: (data) => sendRentalRequest(listing.id, data),
    onSuccess: () => {
      toast.success('Request sent successfully!')
      queryClient.invalidateQueries(['equipment'])
      onClose()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send request')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      rentalBasis: form.rentalBasis,
      description: form.description || undefined,
    }
    if (form.rentalBasis === 'DAILY') {
      payload.fromDate = form.fromDate
      payload.toDate = form.toDate
    } else {
      payload.numHours = parseInt(form.numHours)
    }
    mutation.mutate(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Request — {listing.equipmentType}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Rental basis selector — only show if listing supports BOTH */}
          {listing.rentalBasis === 'BOTH' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rental Type</label>
              <div className="flex gap-3">
                {['DAILY', 'HOURLY'].map((basis) => (
                  <button
                    key={basis}
                    type="button"
                    onClick={() => setForm({ ...form, rentalBasis: basis })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.rentalBasis === basis
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {basis === 'DAILY' ? `Daily — ₹${listing.dailyRate}/day` : `Hourly — ₹${listing.hourlyRate}/hr`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date fields for daily */}
          {form.rentalBasis === 'DAILY' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={form.fromDate}
                  onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                  min={listing.availableFrom}
                  max={listing.availableTill}
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
                  min={form.fromDate || listing.availableFrom}
                  max={listing.availableTill}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Hours field for hourly */}
          {form.rentalBasis === 'HOURLY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Hours</label>
              <input
                type="number"
                min={1}
                value={form.numHours}
                onChange={(e) => setForm({ ...form, numHours: e.target.value })}
                placeholder="How many hours do you need?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message to Owner (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your requirement..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}