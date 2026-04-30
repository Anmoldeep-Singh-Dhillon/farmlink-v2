import { useState, useRef } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X, Check } from 'lucide-react'

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  )
}

export default function ImageCropModal({ imageSrc, aspect, onCropDone, onClose }) {
  const imgRef = useRef(null)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()

  const onImageLoad = (e) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspect))
  }

  const getCroppedBlob = () => {
    if (!completedCrop || !imgRef.current) return

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY

    const ctx = canvas.getContext('2d')
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })
        const previewUrl = URL.createObjectURL(blob)
        onCropDone(croppedFile, previewUrl)
      }
    }, 'image/jpeg', 0.95)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">

        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Crop Image</h2>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-4 flex justify-center bg-gray-50 min-h-48">
          {imageSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              minWidth={50}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                onLoad={onImageLoad}
                style={{ maxHeight: '400px', maxWidth: '100%' }}
                alt="crop preview"
              />
            </ReactCrop>
          ) : (
            <div className="flex items-center justify-center text-gray-400">
              Loading image...
            </div>
          )}
        </div>

        <div className="p-4 flex gap-3 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={getCroppedBlob}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  )
}