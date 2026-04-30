import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createListing, getMyListings, deleteListing } from '../../api/equipment'
import toast from 'react-hot-toast'
import { Trash2, Plus, X } from 'lucide-react'
import ImageCropModal from '../../components/common/ImageCropModal'

const EQUIPMENT_TYPES = ['Plough', 'Seeder', 'Trolley', 'Harvester', 'Tractor', 'Rotavator', 'Sprayer', 'Other']

export default function ListEquipmentPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [images, setImages] = useState([])
  const [cropSrc, setCropSrc] = useState(null)
  const [croppedImages, setCroppedImages] = useState([])
  const [currentCropIndex, setCurrentCropIndex] = useState(0)
  const [pendingFiles, setPendingFiles] = useState([])
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    equipmentType: '',
    description: '',
    rentalBasis: 'DAILY',
    hourlyRate: '',
    dailyRate: '',
    securityDeposit: '',
    availableFrom: '',
    availableTill: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: getMyListings,
  })

  const myListings = data?.data || []

  const createMutation = useMutation({
    mutationFn: (formData) => createListing(formData),
    onSuccess: () => {
      toast.success('Equipment listed successfully!')
      queryClient.invalidateQueries(['myListings'])
      setShowForm(false)
      setForm({
        equipmentType: '', description: '', rentalBasis: 'DAILY',
        hourlyRate: '', dailyRate: '', securityDeposit: '',
        availableFrom: '', availableTill: '',
      })
      setImages([])
      setCroppedImages([])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create listing'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      toast.success('Listing deleted')
      queryClient.invalidateQueries(['myListings'])
    },
    onError: () => toast.error('Failed to delete listing'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData()
    const data = {
      equipmentType: form.equipmentType,
      description: form.description || undefined,
      rentalBasis: form.rentalBasis,
      hourlyRate: form.rentalBasis !== 'DAILY' ? parseFloat(form.hourlyRate) : undefined,
      dailyRate: form.rentalBasis !== 'HOURLY' ? parseFloat(form.dailyRate) : undefined,
      securityDeposit: parseFloat(form.securityDeposit),
      availableFrom: form.availableFrom,
      availableTill: form.availableTill,
    }
    formData.append('data', JSON.stringify(data))
    images.forEach((img) => formData.append('images', img))
    createMutation.mutate(formData)
  }

  const statusColor = (status) => {
    if (status === 'ACTIVE') return 'bg-green-100 text-green-700'
    if (status === 'BOOKED') return 'bg-red-100 text-red-600'
    if (status === 'EXPIRED') return 'bg-gray-100 text-gray-500'
    return 'bg-gray-100 text-gray-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Equipment Listings</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus size={16} />
          List Equipment
        </button>
      </div>

      {isLoading && <div className="text-center py-12 text-gray-500">Loading...</div>}

      {!isLoading && myListings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No listings yet</p>
          <p className="text-sm mt-1">Click "List Equipment" to add your first listing</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myListings.map((listing) => (
          <div key={listing.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            {listing.images?.length > 0 ? (
              <img
                src={listing.images[0].imageUrl}
                alt={listing.equipmentType}
                className="w-full h-36 object-cover object-top rounded-lg mb-3"
              />
            ) : (
              <div className="w-full h-36 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                <span className="text-3xl">🚜</span>
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{listing.equipmentType}</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(listing.status)}`}>
                {listing.status}
              </span>
            </div>

            <div className="flex gap-2 mb-3">
              {listing.hourlyRate && (
                <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                  ₹{listing.hourlyRate}/hr
                </span>
              )}
              {listing.dailyRate && (
                <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                  ₹{listing.dailyRate}/day
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 mb-3">
              {listing.availableFrom} → {listing.availableTill}
            </p>

            <button
              onClick={() => deleteMutation.mutate(listing.id)}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700"
            >
              <Trash2 size={13} />
              Delete listing
            </button>
          </div>
        ))}
      </div>

      {/* Create listing modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">List Your Equipment</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type</label>
                <select
                  value={form.equipmentType}
                  onChange={(e) => setForm({ ...form, equipmentType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select equipment type</option>
                  {EQUIPMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your equipment..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rental Basis</label>
                <div className="flex gap-2">
                  {['HOURLY', 'DAILY', 'BOTH'].map((basis) => (
                    <button
                      key={basis}
                      type="button"
                      onClick={() => setForm({ ...form, rentalBasis: basis })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.rentalBasis === basis
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {basis}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {form.rentalBasis !== 'DAILY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (₹)</label>
                    <input
                      type="number"
                      value={form.hourlyRate}
                      onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                      placeholder="Rate per hour"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                )}
                {form.rentalBasis !== 'HOURLY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (₹)</label>
                    <input
                      type="number"
                      value={form.dailyRate}
                      onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                      placeholder="Rate per day"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={form.securityDeposit}
                    onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
                    placeholder="Security deposit"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                  <input
                    type="date"
                    value={form.availableFrom}
                        onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Till</label>
                  <input
                    type="date"
                    value={form.availableTill}
                      onChange={(e) => setForm({ ...form, availableTill: e.target.value })}
                      min={form.availableFrom || new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Images (optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                        const files = Array.from(e.target.files)
                        if (files.length === 0) return
                        const allowed = ['image/jpeg', 'image/png', 'image/webp']
                        const validFiles = files.filter(file => allowed.includes(file.type))
                        if (validFiles.length === 0) {
                            toast.error('Only JPEG, PNG or WebP images are supported')
                            e.target.value = ''
                            return
                          }
                          if (validFiles.length !== files.length) {
                            toast.error('Some files were skipped (only JPEG, PNG, WebP allowed)')
                                }
                        setPendingFiles(validFiles)
                        setCroppedImages([])
                        const reader = new FileReader()
                        reader.onload = () => setCropSrc(reader.result)
                        reader.readAsDataURL(validFiles[0])
                        setCurrentCropIndex(0)
                      }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                {croppedImages.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {croppedImages.map((img, i) => (
                      <img key={i} src={img.preview} className="w-16 h-16 object-cover rounded-lg border" />
                    ))}
                    <p className="text-xs text-green-600 w-full">{croppedImages.length} image(s) cropped</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Listing...' : 'List Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crop modal - outside the form modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={16 / 9}
          onClose={() => {
            setCropSrc(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
          onCropDone={(file, preview) => {
            const newCropped = [...croppedImages, { file, preview }]
            setCroppedImages(newCropped)
            const nextIndex = currentCropIndex + 1
            if (nextIndex < pendingFiles.length) {
              setCurrentCropIndex(nextIndex)
              const reader = new FileReader()
              reader.onload = () => setCropSrc(reader.result)
              reader.readAsDataURL(pendingFiles[nextIndex])
            } else {
              setCropSrc(null)
              setImages(newCropped.map((c) => c.file))
            }
          }}
        />
      )}
    </div>
  )
}