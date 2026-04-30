import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createOperatorProfile, getMyOperatorProfile, deleteOperatorProfile } from '../../api/operators'
import toast from 'react-hot-toast'
import ImageCropModal from '../../components/common/ImageCropModal'
import { Trash2 } from 'lucide-react'

const SERVICES = ['SEEDING', 'PLOUGHING', 'HARVESTING', 'TRANSPORT', 'LEVELING', 'OTHER']

export default function CreateOperatorProfilePage() {
  const queryClient = useQueryClient()
  const [selectedServices, setSelectedServices] = useState([])
  const [profilePicture, setProfilePicture] = useState(null)
  const [cropSrc, setCropSrc] = useState(null)
  const [profilePreview, setProfilePreview] = useState(null)
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    hourlyRate: '',
    dailyRate: '',
    isRateNegotiable: false,
    bio: '',
  })

  const { data: profileData, isLoading } = useQuery({
      queryKey: ['myOperatorProfile'],
      queryFn: getMyOperatorProfile,
      retry: false,
      throwOnError: false,
  })

    const profile = profileData?.data?.status !== 'DELETED' ? profileData?.data : null

  const mutation = useMutation({
    mutationFn: (formData) => createOperatorProfile(formData),
    onSuccess: () => {
      toast.success('Operator profile created!')
      queryClient.invalidateQueries(['myOperatorProfile'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create profile'),
  })

 const deleteMutation = useMutation({
    mutationFn: deleteOperatorProfile,
    onSuccess: () => {
        toast.success('Profile deleted')
        queryClient.removeQueries(['myOperatorProfile'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
})

  const toggleService = (service) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service')
      return
    }
    const formData = new FormData()
    const data = {
      servicesOffered: selectedServices,
      hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
      dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : undefined,
      isRateNegotiable: form.isRateNegotiable,
      bio: form.bio || undefined,
    }
    formData.append('data', JSON.stringify(data))
    if (profilePicture) formData.append('profilePicture', profilePicture)
    mutation.mutate(formData)
  }

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  if (profile) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Operator Profile</h1>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-lg">
          <div className="flex justify-center mb-4">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-4xl">👨‍🌾</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Services</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profile.servicesOffered?.map((s) => (
                  <span key={s} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              {profile.hourlyRate && (
                <div>
                  <p className="text-xs text-gray-400">Hourly Rate</p>
                  <p className="font-semibold text-gray-800">₹{profile.hourlyRate}/hr</p>
                </div>
              )}
              {profile.dailyRate && (
                <div>
                  <p className="text-xs text-gray-400">Daily Rate</p>
                  <p className="font-semibold text-gray-800">₹{profile.dailyRate}/day</p>
                </div>
              )}
            </div>

            {profile.isRateNegotiable && (
              <p className="text-sm text-orange-600">✓ Rate is negotiable</p>
            )}

            {profile.bio && (
              <div>
                <p className="text-xs text-gray-400">Bio</p>
                <p className="text-sm text-gray-700">{profile.bio}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400">Status</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                profile.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                {profile.status}
              </span>
            </div>

            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 mt-2"
            >
              <Trash2 size={13} />
              {deleteMutation.isPending ? 'Deleting...' : 'Delete profile'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Become an Operator</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Services You Offer
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedServices.includes(s)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (₹)</label>
              <input
                type="number"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                placeholder="Per hour"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (₹)</label>
              <input
                type="number"
                value={form.dailyRate}
                onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                placeholder="Per day"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="negotiable"
              checked={form.isRateNegotiable}
              onChange={(e) => setForm({ ...form, isRateNegotiable: e.target.checked })}
              className="w-4 h-4 accent-green-600"
            />
            <label htmlFor="negotiable" className="text-sm text-gray-700">
              Rate is negotiable
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio (optional)</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell farmers about your experience..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Picture (optional)
            </label>
            {profilePreview && (
              <div className="flex justify-center mb-3">
                <img
                  src={profilePreview}
                  className="w-24 h-24 rounded-full object-cover border-2 border-green-400"
                />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0]
                if (!file) return
                
                const allowed = ['image/jpeg', 'image/png', 'image/webp']
                if (!allowed.includes(file.type)) {
                  toast.error('Only JPEG, PNG or WebP images are supported')
                  e.target.value = ''
                  return
                }
  
  const reader = new FileReader()
  reader.onload = () => setCropSrc(reader.result)
  reader.readAsDataURL(file)
}}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating...' : 'Create Operator Profile'}
          </button>
        </form>
      </div>

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={1}
          onClose={() => {
            setCropSrc(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
          onCropDone={(file, preview) => {
            setProfilePicture(file)
            setProfilePreview(preview)
            setCropSrc(null)
          }}
        />
      )}
    </div>
  )
}