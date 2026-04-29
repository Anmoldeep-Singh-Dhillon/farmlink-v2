import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getReceivedHireRequests, acceptHireRequest, rejectHireRequest } from '../../api/operators'
import toast from 'react-hot-toast'
import { Check, X } from 'lucide-react'

export default function ReceivedHireRequestsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['receivedHireRequests'],
    queryFn: getReceivedHireRequests,
  })

  const requests = data?.data || []

  const acceptMutation = useMutation({
    mutationFn: acceptHireRequest,
    onSuccess: () => {
      toast.success('Hire request accepted!')
      queryClient.invalidateQueries(['receivedHireRequests'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to accept'),
  })

  const rejectMutation = useMutation({
    mutationFn: rejectHireRequest,
    onSuccess: () => {
      toast.success('Hire request rejected')
      queryClient.invalidateQueries(['receivedHireRequests'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
  })

  const statusColor = (status) => {
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700'
    if (status === 'ACCEPTED') return 'bg-green-100 text-green-700'
    if (status === 'REJECTED') return 'bg-red-100 text-red-600'
    return 'bg-gray-100 text-gray-500'
  }

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Hire Requests Received</h1>

      {requests.length === 0 && (
        <div className="text-center py-12 text-gray-500">No hire requests received yet</div>
      )}

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">Hire Request #{req.id}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(req.requestedAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(req.status)}`}>
                {req.status}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium text-gray-700">{req.requester?.fullName}</p>
              <p className="text-xs text-gray-500">{req.requester?.mobile}</p>
              <p className="text-xs text-gray-500">{req.requester?.addressLine}, {req.requester?.city}</p>
            </div>

            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p><span className="font-medium">Dates:</span> {req.fromDate} → {req.toDate}</p>
              <p><span className="font-medium">Offered Rate:</span> ₹{req.offeredRate}/{req.rateBasis === 'DAILY' ? 'day' : 'hr'}</p>
              {req.description && (
                <p><span className="font-medium">Note:</span> {req.description}</p>
              )}
            </div>

            {req.status === 'PENDING' && (
              <div className="flex gap-3">
                <button
                  onClick={() => rejectMutation.mutate(req.id)}
                  disabled={rejectMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                >
                  <X size={14} />
                  Reject
                </button>
                <button
                  onClick={() => acceptMutation.mutate(req.id)}
                  disabled={acceptMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                >
                  <Check size={14} />
                  Accept
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}