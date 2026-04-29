import { useState } from 'react'
import { Phone, Send, MapPin, Calendar, Shield } from 'lucide-react'
import RentalRequestModal from './RentalRequestModal'

export default function EquipmentCard({ listing }) {
  const [showModal, setShowModal] = useState(false)

  const isExpired = new Date(listing.availableTill) < new Date()
  const isBooked = listing.status === 'BOOKED'

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">

        {/* Image */}
        {listing.images?.length > 0 ? (
          <img
            src={listing.images[0].imageUrl}
            alt={listing.equipmentType}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <span className="text-4xl">🚜</span>
          </div>
        )}

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-800 text-lg">{listing.equipmentType}</h3>
            {isBooked && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                Booked
              </span>
            )}
            {isExpired && !isBooked && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">
                Expired
              </span>
            )}
          </div>

          {listing.description && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{listing.description}</p>
          )}

          {/* Rates */}
          <div className="flex gap-3 mb-3">
            {listing.hourlyRate && (
              <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                ₹{listing.hourlyRate}/hr
              </span>
            )}
            {listing.dailyRate && (
              <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                ₹{listing.dailyRate}/day
              </span>
            )}
          </div>

          {/* Details */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield size={12} />
              <span>Security deposit: ₹{listing.securityDeposit}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar size={12} />
              <span>{listing.availableFrom} → {listing.availableTill}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin size={12} />
              <span>{listing.owner?.city}</span>
            </div>
          </div>

          {/* Owner */}
          <div className="border-t pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">{listing.owner?.fullName}</p>
              <p className="text-xs text-gray-400">{listing.owner?.mobile}</p>
            </div>

            <div className="flex gap-2">
              <a
                href={`tel:${listing.owner?.mobile}`}
                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Phone size={16} />
              </a>
              {!isBooked && !isExpired && (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Send size={14} />
                  Request
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <RentalRequestModal
          listing={listing}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}