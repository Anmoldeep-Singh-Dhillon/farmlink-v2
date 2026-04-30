import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAllRead, markRead } from '../../api/notifications'
import toast from 'react-hot-toast'
import { Bell, Check } from 'lucide-react'

const typeColor = (type) => {
  if (type?.includes('ACCEPTED')) return 'bg-green-50 border-green-200'
  if (type?.includes('REJECTED')) return 'bg-red-50 border-red-200'
  if (type?.includes('RECEIVED')) return 'bg-blue-50 border-blue-200'
  return 'bg-gray-50 border-gray-200'
}

const typeIcon = (type) => {
  if (type?.includes('RENTAL')) return '🚜'
  if (type?.includes('HIRE')) return '👨‍🌾'
  if (type?.includes('JOB')) return '💼'
  return '🔔'
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  })

  const notifications = data?.data || []

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['unreadCount'])
      toast.success('All marked as read')
    },
  })

  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['unreadCount'])
    },
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 border border-green-300 px-3 py-2 rounded-lg hover:bg-green-50"
          >
            <Check size={14} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">No notifications yet</p>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => !notif.isRead && markReadMutation.mutate(notif.id)}
            className={`rounded-xl border p-4 cursor-pointer transition-all ${
              typeColor(notif.type)
            } ${!notif.isRead ? 'shadow-sm' : 'opacity-70'}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{typeIcon(notif.type)}</span>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              {!notif.isRead && (
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}