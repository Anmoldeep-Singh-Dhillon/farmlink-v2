import { useState } from 'react'
import { Phone, Send } from 'lucide-react'
import HireRequestModal from './HireRequestModal'
import ImageLightbox from '../common/ImageLightbox'

export default function OperatorCard({ operator }) {
  const [showModal, setShowModal] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const isBooked = operator.status === 'BOOKED'

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">

        {/* Profile picture */}
        {operator.profilePictureUrl ? (
          <div className="cursor-pointer" onClick={() => setShowLightbox(true)}>
            <img
              src={operator.profilePictureUrl}
              alt={operator.user?.fullName}
              className="w-full h-48 object-cover object-top"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-green-50 flex items-center justify-center">
            <span className="text-5xl">👨‍🌾</span>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-800">{operator.user?.fullName}</h3>
            {isBooked && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                Booked
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-3">{operator.user?.city}</p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {operator.servicesOffered?.map((s) => (
              <span key={s} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>

          <div className="flex gap-2 mb-3">
            {operator.hourlyRate && (
              <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                ₹{operator.hourlyRate}/hr
              </span>
            )}
            {operator.dailyRate && (
              <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                ₹{operator.dailyRate}/day
              </span>
            )}
            {operator.isRateNegotiable && (
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                Negotiable
              </span>
            )}
          </div>

          {operator.bio && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{operator.bio}</p>
          )}

          <div className="border-t pt-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">{operator.user?.mobile}</p>
            <div className="flex gap-2">
              <a
                href={`tel:${operator.user?.mobile}`}
                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
              >
                <Phone size={16} />
              </a>
              {!isBooked && (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  <Send size={14} />
                  Hire
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <HireRequestModal operator={operator} onClose={() => setShowModal(false)} />
      )}

      {showLightbox && operator.profilePictureUrl && (
        <ImageLightbox
          images={[operator.profilePictureUrl]}
          startIndex={0}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  )
}