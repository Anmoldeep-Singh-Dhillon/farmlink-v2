import { useQuery } from '@tanstack/react-query'
import { getSentHireRequests } from '../../api/operators'

export default function SentHireRequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sentHireRequests'],
    queryFn: getSentHireRequests,
  })

  const requests = data?.data || []

  const statusColor = (status) => {
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700'
    if (status === 'ACCEPTED') return 'bg-green-100 text-green-700'
    if (status === 'REJECTED') return 'bg-red-100 text-red-600'
    return 'bg-gray-100 text-gray-500'
  }

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Sent Hire Requests</h1>

      {requests.length === 0 && (
        <div className="text-center py-12 text-gray-500">You haven't sent any hire requests yet</div>
      )}

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">
                  {req.operator?.user?.fullName || 'Operator'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Sent on {new Date(req.requestedAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(req.status)}`}>
                {req.status}
              </span>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Dates:</span> {req.fromDate} → {req.toDate}</p>
              <p><span className="font-medium">Offered Rate:</span> ₹{req.offeredRate}/{req.rateBasis === 'DAILY' ? 'day' : 'hr'}</p>
              {req.description && (
                <p><span className="font-medium">Note:</span> {req.description}</p>
              )}
              {req.respondedAt && (
                <p><span className="font-medium">Responded:</span> {new Date(req.respondedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}