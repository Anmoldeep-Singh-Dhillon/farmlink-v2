import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Main pages
import Layout from './components/common/Layout'
import RentEquipmentPage from './pages/equipment/RentEquipmentPage'
import ListEquipmentPage from './pages/equipment/ListEquipmentPage'
import ReceivedRequestsPage from './pages/equipment/ReceivedRequestsPage'
import SentRequestsPage from './pages/equipment/SentRequestsPage'

import HireOperatorPage from './pages/operators/HireOperatorPage'
import CreateOperatorProfilePage from './pages/operators/CreateOperatorProfilePage'
import ReceivedHireRequestsPage from './pages/operators/ReceivedHireRequestsPage'
import SentHireRequestsPage from './pages/operators/SentHireRequestsPage'

import JobOpeningsPage from './pages/jobs/JobOpeningsPage'
import PostJobPage from './pages/jobs/PostJobPage'
import ReceivedApplicationsPage from './pages/jobs/ReceivedApplicationsPage'
import SentApplicationsPage from './pages/jobs/SentApplicationsPage'

import HistoryPage from './pages/history/HistoryPage'

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/equipment/rent" replace />} />

          {/* Equipment */}
          <Route path="equipment/rent" element={<RentEquipmentPage />} />
          <Route path="equipment/list" element={<ListEquipmentPage />} />
          <Route path="equipment/requests/received" element={<ReceivedRequestsPage />} />
          <Route path="equipment/requests/sent" element={<SentRequestsPage />} />

          {/* Operators */}
          <Route path="operators/hire" element={<HireOperatorPage />} />
          <Route path="operators/create-profile" element={<CreateOperatorProfilePage />} />
          <Route path="operators/requests/received" element={<ReceivedHireRequestsPage />} />
          <Route path="operators/requests/sent" element={<SentHireRequestsPage />} />

          {/* Jobs */}
          <Route path="jobs" element={<JobOpeningsPage />} />
          <Route path="jobs/post" element={<PostJobPage />} />
          <Route path="jobs/applications/received" element={<ReceivedApplicationsPage />} />
          <Route path="jobs/applications/sent" element={<SentApplicationsPage />} />

          {/* History */}
          <Route path="history" element={<HistoryPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}