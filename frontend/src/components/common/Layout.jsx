import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Tractor, List, Inbox, Send, Users, UserPlus,
  Briefcase, PlusCircle, History, LogOut, Bell, Menu, X
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { getUnreadCount } from '../../api/notifications'

const navSections = [
  {
    title: 'Equipment',
    links: [
      { to: '/equipment/rent', label: 'Rent Equipment', icon: Tractor },
      { to: '/equipment/list', label: 'List Equipment', icon: List },
      { to: '/equipment/requests/received', label: 'Requests Received', icon: Inbox },
      { to: '/equipment/requests/sent', label: 'Requests Sent', icon: Send },
    ],
  },
  {
    title: 'Operators',
    links: [
      { to: '/operators/hire', label: 'Hire Operator', icon: Users },
      { to: '/operators/create-profile', label: 'Become Operator', icon: UserPlus },
      { to: '/operators/requests/received', label: 'Hire Requests Received', icon: Inbox },
      { to: '/operators/requests/sent', label: 'Hire Requests Sent', icon: Send },
    ],
  },
  {
    title: 'Jobs',
    links: [
      { to: '/jobs', label: 'Job Openings', icon: Briefcase },
      { to: '/jobs/post', label: 'Post a Job', icon: PlusCircle },
      { to: '/jobs/applications/received', label: 'Applications Received', icon: Inbox },
      { to: '/jobs/applications/sent', label: 'Applications Sent', icon: Send },
    ],
  },
  {
    title: 'Other',
    links: [
      { to: '/history', label: 'My History', icon: History },
    ],
  },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: getUnreadCount,
    refetchInterval: 30000, // refresh every 30 seconds
  })

  const unreadCount = unreadData?.data?.unreadCount || 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <span className="text-xl font-bold text-green-600">🌾 FarmLink</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b bg-green-50">
          <p className="text-sm font-semibold text-gray-800">{user?.fullName}</p>
          <p className="text-xs text-gray-500">{user?.mobile}</p>
          <p className="text-xs text-gray-500">{user?.city}</p>
        </div>

        {/* Nav links */}
        <nav className="overflow-y-auto flex-1 px-4 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.links.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-green-100 text-green-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`
                      }
                    >
                      <Icon size={16} />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>

          <span className="text-sm font-medium text-gray-600 lg:hidden">🌾 FarmClick</span>

          {/* Notification bell */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg hover:bg-gray-100 ml-auto"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}