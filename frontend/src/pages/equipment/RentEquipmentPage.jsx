import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getNearbyListings } from '../../api/equipment'
import useAuthStore from '../../store/authStore'
import EquipmentCard from '../../components/equipment/EquipmentCard'
import { Search, SlidersHorizontal } from 'lucide-react'

export default function RentEquipmentPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [radiusKm, setRadiusKm] = useState(10)
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['equipment', user?.latitude, user?.longitude, radiusKm, search],
    queryFn: () => getNearbyListings(user?.latitude, user?.longitude, {
      radiusKm,
      equipmentType: search || undefined,
    }),
    enabled: !!user?.latitude,
  })

  const listings = data?.data?.content || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Rent Equipment</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by equipment type (Plough, Seeder...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Radius: {radiusKm} km
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full accent-green-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 km</span>
            <span>100 km</span>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading && (
        <div className="text-center py-12 text-gray-500">Loading listings...</div>
      )}

      {isError && (
        <div className="text-center py-12 text-red-500">Failed to load listings</div>
      )}

      {!isLoading && listings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No equipment found nearby</p>
          <p className="text-sm mt-1">Try increasing the search radius</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <EquipmentCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}