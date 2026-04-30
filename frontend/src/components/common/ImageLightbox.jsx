import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

export default function ImageLightbox({ images, startIndex = 0, onClose }) {
  return (
    <Lightbox
      open={true}
      close={onClose}
      index={startIndex}
      slides={images.map((src) => ({ src }))}
    />
  )
}