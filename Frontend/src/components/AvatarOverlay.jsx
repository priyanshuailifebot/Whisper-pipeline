import { useEffect, useRef } from 'react'

const AvatarOverlay = ({ isStarted, active }) => {
  const videoRef = useRef(null)

  // Attach global video stream once available
  useEffect(() => {
    if (!isStarted || !active) return
    const interval = setInterval(() => {
      const srcVideo = document.getElementById('avatar-video')
      if (srcVideo && videoRef.current && srcVideo.srcObject) {
        videoRef.current.srcObject = srcVideo.srcObject
        videoRef.current.play().catch(err => console.log('Overlay play error:', err))
        clearInterval(interval)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [isStarted, active])

  if (!isStarted) return null

  return (
    <div className={`avatar-overlay ${active ? 'active' : ''}`}>
      <video
        id="avatar-overlay-video"
        ref={videoRef}
        autoPlay
        playsInline
        muted
      />
    </div>
  )
}

export default AvatarOverlay
