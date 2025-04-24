"use client"

import { useEffect } from "react"
import { Package, MapPin, Clock, DollarSign, ArrowRight } from "lucide-react"

const NewOrderCard = ({ order, onAccept, onReject, swipeRef }) => {
  // Add a click handler for desktop users
  const handleAcceptClick = () => {
    onAccept()
  }

  // Initialize touch events for the swipe functionality
  useEffect(() => {
    if (!swipeRef.current) return

    let startX = 0
    let isDragging = false

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX
      isDragging = true
      swipeRef.current.style.transition = "none"
    }

    const handleTouchMove = (e) => {
      if (!isDragging) return

      const currentX = e.touches[0].clientX
      const diff = currentX - startX

      if (diff > 0) {
        const translateX = Math.min(diff, 250) // Max swipe distance
        swipeRef.current.style.transform = `translateX(${translateX}px)`

        // Change background color based on progress
        const progress = Math.min(diff / 250, 1)
        const bgColor = `rgba(74, 144, 226, ${progress})`
        swipeRef.current.style.backgroundColor = bgColor
      }
    }

    const handleTouchEnd = (e) => {
      isDragging = false
      swipeRef.current.style.transition = "transform 0.3s ease, background-color 0.3s ease"

      const currentX = e.changedTouches[0].clientX
      const diff = currentX - startX

      if (diff > 150) {
        // Threshold to accept
        onAccept()
      } else {
        // Reset position
        swipeRef.current.style.transform = "translateX(0)"
        swipeRef.current.style.backgroundColor = "#f0f0f0"
      }
    }

    // Add mouse events for desktop users
    const handleMouseDown = (e) => {
      startX = e.clientX
      isDragging = true
      swipeRef.current.style.transition = "none"
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    const handleMouseMove = (e) => {
      if (!isDragging) return

      const currentX = e.clientX
      const diff = currentX - startX

      if (diff > 0) {
        const translateX = Math.min(diff, 250) // Max swipe distance
        swipeRef.current.style.transform = `translateX(${translateX}px)`

        // Change background color based on progress
        const progress = Math.min(diff / 250, 1)
        const bgColor = `rgba(74, 144, 226, ${progress})`
        swipeRef.current.style.backgroundColor = bgColor
      }
    }

    const handleMouseUp = (e) => {
      isDragging = false
      swipeRef.current.style.transition = "transform 0.3s ease, background-color 0.3s ease"

      const currentX = e.clientX
      const diff = currentX - startX

      if (diff > 150) {
        // Threshold to accept
        onAccept()
      } else {
        // Reset position
        swipeRef.current.style.transform = "translateX(0)"
        swipeRef.current.style.backgroundColor = "#f0f0f0"
      }

      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    const element = swipeRef.current

    // Add touch events for mobile
    element.addEventListener("touchstart", handleTouchStart)
    element.addEventListener("touchmove", handleTouchMove)
    element.addEventListener("touchend", handleTouchEnd)

    // Add mouse events for desktop
    element.addEventListener("mousedown", handleMouseDown)

    return () => {
      if (element) {
        // Remove touch events
        element.removeEventListener("touchstart", handleTouchStart)
        element.removeEventListener("touchmove", handleTouchMove)
        element.removeEventListener("touchend", handleTouchEnd)

        // Remove mouse events
        element.removeEventListener("mousedown", handleMouseDown)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [onAccept, swipeRef])

  return (
    <div className="order-card">
      <div className="order-header">
        <h2>New Order #{order.id}</h2>
        <span className="new-badge">New</span>
      </div>

      <div className="order-detail">
        <Package size={18} />
        <div className="detail-content">
          <h3>Package Details</h3>
          <p>{order.packageDetails}</p>
        </div>
      </div>

      <div className="order-detail">
        <MapPin size={18} />
        <div className="detail-content">
          <h3>Pickup Location</h3>
          <p>{order.pickupLocation.address}</p>
        </div>
      </div>

      <div className="order-detail">
        <MapPin size={18} />
        <div className="detail-content">
          <h3>Dropoff Location</h3>
          <p>{order.dropoffLocation.address}</p>
        </div>
      </div>

      <div className="order-footer">
        <div className="order-price">
          <DollarSign size={18} />
          <span>${order.price.toFixed(2)}</span>
        </div>

        <div className="order-eta">
          <Clock size={18} />
          <span>Est. {order.estimatedTime}</span>
        </div>
      </div>

      <div className="order-actions">
        <button className="reject-button" onClick={onReject}>
          Reject
        </button>

        <div className="swipe-container">
          <div
            className="swipe-button"
            ref={swipeRef}
            onClick={handleAcceptClick} // Add click handler for desktop users
          >
            <span>Swipe to accept order</span>
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewOrderCard

