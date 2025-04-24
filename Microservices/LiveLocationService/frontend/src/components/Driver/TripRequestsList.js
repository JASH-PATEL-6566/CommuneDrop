"use client"
import { MapPin, Clock, DollarSign, Check, X } from "lucide-react"

const TripRequestsList = ({ requests, onAccept, onReject }) => {
  // Format timestamp to a readable format
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Ensure each request has properly formatted location data before rendering
  const processedRequests = requests.map((request) => {
    // Make sure pickupLocation and dropoffLocation are properly formatted
    const processedRequest = {
      ...request,
      pickupLocation: request.pickupLocation || {
        lat: 44.643,
        lng: -63.5793,
        address: request.from || "Unknown pickup location",
      },
      dropoffLocation: request.dropoffLocation || {
        lat: 44.6418,
        lng: -63.5784,
        address: request.to || "Unknown dropoff location",
      },
    }

    // Ensure the location objects have proper lat/lng values
    if (!processedRequest.pickupLocation.lat || !processedRequest.pickupLocation.lng) {
      processedRequest.pickupLocation = {
        lat: 44.643,
        lng: -63.5793,
        address: request.from || "Unknown pickup location",
      }
    }

    if (!processedRequest.dropoffLocation.lat || !processedRequest.dropoffLocation.lng) {
      processedRequest.dropoffLocation = {
        lat: 44.6418,
        lng: -63.5784,
        address: request.to || "Unknown dropoff location",
      }
    }

    return processedRequest
  })

  return (
    <div className="trip-requests-list">
      <h2 className="trip-requests-title">Delivery Requests</h2>

      {processedRequests.map((request) => (
        <div key={request.id} className={`trip-request-card ${request.urgent ? "urgent" : ""}`}>
          <div className="request-header">
            <h3>Order #{request.orderId}</h3>
            {request.urgent && <span className="urgent-badge">Urgent</span>}
          </div>

          <div className="request-detail">
            <MapPin size={18} />
            <div className="detail-content">
              <h4>Pickup</h4>
              <p>{request.from}</p>
            </div>
          </div>

          <div className="request-detail">
            <MapPin size={18} />
            <div className="detail-content">
              <h4>Dropoff</h4>
              <p>{request.to}</p>
            </div>
          </div>

          <div className="request-footer">
            <div className="request-price">
              <DollarSign size={18} />
              <span>${Number.parseFloat(request.price).toFixed(2)}</span>
            </div>

            <div className="request-time">
              <Clock size={18} />
              <span>{formatTime(request.timestamp)}</span>
            </div>
          </div>

          <div className="request-actions">
            <button className="reject-button" onClick={() => onReject(request.id)} aria-label="Reject request">
              <X size={20} />
            </button>
            <button className="accept-button" onClick={() => onAccept(request)} aria-label="Accept request">
              <Check size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TripRequestsList

