import { useState } from 'react'
import { Phone, Send, MapPin, Calendar } from 'lucide-react'
import JobApplicationModal from './JobApplicationModal'

export default function JobCard({ job }) {
  const [showModal, setShowModal] = useState(false)
  const isBooked = job.status === 'BOOKED'
  const isExpired = new Date(job.workToDate) < new Date()

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-800 text-base">{job.title}</h3>
            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full mt-1 inline-block">
              {job.serviceNeeded}
            </span>
          </div>
          {isBooked && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
              Filled
            </span>
          )}
          {isExpired && !isBooked && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">
              Expired
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{job.description}</p>

        <div className="space-y-1.5 mb-4">
          {job.desiredRate && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-green-700 font-medium">
                Budget: ₹{job.desiredRate}/{job.rateBasis === 'DAILY' ? 'day' : 'hr'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar size={12} />
            <span>{job.workFromDate} → {job.workToDate}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={12} />
            <span>{job.postedBy?.city}</span>
          </div>
        </div>

        <div className="border-t pt-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">{job.postedBy?.fullName}</p>
            <p className="text-xs text-gray-400">{job.postedBy?.mobile}</p>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${job.postedBy?.mobile}`}
              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
            >
              <Phone size={16} />
            </a>
            {!isBooked && !isExpired && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                <Send size={14} />
                Apply
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <JobApplicationModal job={job} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}