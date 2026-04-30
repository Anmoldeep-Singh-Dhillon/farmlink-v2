import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMyHistory, getHistoryByType } from '../../api/history'

const HISTORY_TYPES = [
  { value: '', label: 'All' },
  { value: 'EQUIPMENT_RENTED_OUT', label: 'Equipment Rented Out' },
  { value: 'EQUIPMENT_RENTED_IN', label: 'Equipment Rented In' },
  { value: 'OPERATOR_HIRED_OUT', label: 'Hired as Operator' },
  { value: 'OPERATOR_HIRED_IN', label: 'Operator Hired' },
  { value: 'JOB_POSTED_FILLED', label: 'Job Filled' },
  { value: 'JOB_APPLICATION_ACCEPTED', label: 'Job Got' },
]

const typeColor = (type) => {
  if (type?.includes('RENTED_OUT') || type?.includes('HIRED_OUT') || type?.includes('FILLED'))
    return 'bg-blue-50 text-blue-700'
  if (type?.includes('RENTED_IN') || type?.includes('HIRED_IN') || type?.includes('APPLICATION'))
    return 'bg-green-50 text-green-700'
  return 'bg-gray-50 text-gray-700'
}

const typeIcon = (type) => {
  if (type?.includes('EQUIPMENT')) return '🚜'
  if (type?.includes('OPERATOR')) return '👨‍🌾'
  if (type?.includes('JOB')) return '💼'
  return '📋'
}

export default function HistoryPage() {
  const [filter, setFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['history', filter],
    queryFn: () => filter ? getHistoryByType(filter) : getMyHistory(),
  })

  const history = data?.data || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My History</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {HISTORY_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setFilter(type.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === type.value
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center py-12 text-gray-500">Loading...</div>}

      {!isLoading && history.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No history yet</p>
          <p className="text-sm mt-1">Your completed bookings will appear here</p>
        </div>
      )}

      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{typeIcon(item.historyType)}</span>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-gray-800 text-sm">{item.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 whitespace-nowrap ${typeColor(item.historyType)}`}>
                    {item.historyType?.replace(/_/g, ' ')}
                  </span>
                </div>

                {item.otherPartyName && (
                  <p className="text-xs text-gray-500 mt-1">
                    With: {item.otherPartyName} • {item.otherPartyMobile}
                  </p>
                )}

                <div className="flex gap-4 mt-2">
                  {item.fromDate && (
                    <p className="text-xs text-gray-400">
                      📅 {item.fromDate} → {item.toDate}
                    </p>
                  )}
                  {item.amount && (
                    <p className="text-xs text-gray-400">
                      💰 ₹{item.amount}
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}