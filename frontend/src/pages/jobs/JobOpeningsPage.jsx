import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getNearbyJobs } from '../../api/jobs'
import useAuthStore from '../../store/authStore'
import JobCard from '../../components/jobs/JobCard'
import { SlidersHorizontal } from 'lucide-react'

const SERVICES = ['SEEDING', 'PLOUGHING', 'HARVESTING', 'TRANSPORT', 'LEVELING', 'OTHER']

export default function JobOpeningsPage() {
  const { user } = useAuthStore()
  const [radiusKm, setRadiusKm] = useState(10)
  const [service, setService] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', user?.latitude, user?.longitude, radiusKm, service],
    queryFn: () => getNearbyJobs(user?.latitude, user?.longitude, {
      radiusKm,
      service: service || undefined,
    }),
    enabled: !!user?.latitude,
  })

  const jobs = data?.data?.content || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Job Openings</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Radius: {radiusKm} km
            </label>
            <input
              type="range" min={1} max={100} value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-green-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Service</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setService('')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  service === '' ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600'
                }`}
              >
                All
              </button>
              {SERVICES.map((s) => (
                <button
                  key={s}
                  onClick={() => setService(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    service === s ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="text-center py-12 text-gray-500">Loading jobs...</div>}

      {!isLoading && jobs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No job openings found nearby</p>
          <p className="text-sm mt-1">Try increasing the search radius</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}