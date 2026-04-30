import { useQuery } from '@tanstack/react-query'
import { getSentApplications } from '../../api/jobs'

export default function SentApplicationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sentApplications'],
    queryFn: getSentApplications,
  })

  const applications = data?.data || []

  const statusColor = (status) => {
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700'
    if (status === 'ACCEPTED') return 'bg-green-100 text-green-700'
    if (status === 'REJECTED') return 'bg-red-100 text-red-600'
    return 'bg-gray-100 text-gray-500'
  }

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Job Applications</h1>

      {applications.length === 0 && (
        <div className="text-center py-12 text-gray-500">You haven't applied for any jobs yet</div>
      )}

      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{app.jobPost?.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Applied on {new Date(app.appliedAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(app.status)}`}>
                {app.status}
              </span>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Service:</span> {app.jobPost?.serviceNeeded}</p>
              <p><span className="font-medium">Work Dates:</span> {app.jobPost?.workFromDate} → {app.jobPost?.workToDate}</p>
              {app.offeredRate && (
                <p><span className="font-medium">Your Rate:</span> ₹{app.offeredRate}/{app.rateBasis === 'DAILY' ? 'day' : 'hr'}</p>
              )}
              {app.coverNote && (
                <p><span className="font-medium">Your Note:</span> {app.coverNote}</p>
              )}
              {app.respondedAt && (
                <p><span className="font-medium">Responded:</span> {new Date(app.respondedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}