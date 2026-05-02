import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login: setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    password: '',
    aadhaarNumber: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    latitude: null,
    longitude: null,
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const getLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({
          ...form,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        toast.success('Location captured!')
        setLocating(false)
      },
      () => {
        toast.error('Could not get location. Please allow location access.')
        setLocating(false)
      }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.latitude || !form.longitude) {
      toast.error('Please capture your location first')
      return
    }
    setLoading(true)
    try {
      const res = await register({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      })
      const token = res.data.token

      const userRes = await import('../../api/axios').then(m => m.default.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      }))

      setAuth(token, userRes.data)
      toast.success('Registration successful!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">

        <div className="text-center mb-8">
          <span className="text-4xl">🌾</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join FarmClick today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="10 digit number"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
              <input
                name="aadhaarNumber"
                value={form.aadhaarNumber}
                onChange={handleChange}
                placeholder="12 digit Aadhaar number"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                name="addressLine"
                value={form.addressLine}
                onChange={handleChange}
                placeholder="House/Village/Street"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="6 digit pincode"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Location
              </label>
              <button
                type="button"
                onClick={getLocation}
                disabled={locating}
                className="w-full border-2 border-dashed border-green-400 rounded-lg px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                {locating ? 'Getting location...' :
                  form.latitude ? `✅ Location captured (${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)})` :
                  '📍 Click to capture current location'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}