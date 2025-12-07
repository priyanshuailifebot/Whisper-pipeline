import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './ImageCarousel.css'

const ImageCarousel = ({ images, autoPlay = false, interval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-advance slides if autoPlay is enabled
  useEffect(() => {
    if (!autoPlay || images.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, images.length])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  if (!images || images.length === 0) {
    return null
  }

  const currentImage = images[currentIndex]

  return (
    <div className="image-carousel">
      <div className="carousel-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="carousel-slide"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={currentImage.src}
              alt={currentImage.alt || `Slide ${currentIndex + 1}`}
              className="carousel-image"
            />
            {currentImage.caption && (
              <motion.div
                className="carousel-caption"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {currentImage.caption}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows (only show if more than 1 image) */}
        {images.length > 1 && (
          <>
            <button
              className="carousel-button carousel-button-prev"
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="carousel-button carousel-button-next"
              onClick={goToNext}
              aria-label="Next image"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator (only show if more than 1 image) */}
      {images.length > 1 && (
        <div className="carousel-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div className="carousel-counter">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}

export default ImageCarousel


