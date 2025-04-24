"use client"
import { User, Package, MapPin, Clock, DollarSign } from "lucide-react"

const TripDetails = ({ trip, tripStatus, onUpdateStatus }) => {
  const renderActionButton = () => {
    switch (tripStatus) {
      case "pickup":
        return (
          <button className="action-button pickup-button" onClick={() => onUpdateStatus("delivering")}>
            Confirm Pickup
          </button>
        )
      case "delivering":
        return (
          <button className="action-button delivery-button" onClick={() => onUpdateStatus("completed")}>
            Confirm Delivery
          </button>
        )
      case "completed":
        return <div className="completed-message">Delivery Completed</div>
      default:
        return null
    }
  }

  return (
    <div className="trip-details-card">
      <div className="trip-header">
        <h2>Trip #{trip.id}</h2>
        <span className={`trip-status-badge ${tripStatus}`}>
          {tripStatus.charAt(0).toUpperCase() + tripStatus.slice(1)}
        </span>
      </div>

      <div className="trip-detail">
        <User size={18} />
        <div className="detail-content">
          <h3>Customer</h3>
          <p>{trip.customerName}</p>
        </div>
      </div>

      <div className="trip-detail">
        <Package size={18} />
        <div className="detail-content">
          <h3>Package Details</h3>
          <p>{trip.packageDetails}</p>
        </div>
      </div>

      <div className="trip-detail">
        <MapPin size={18} />
        <div className="detail-content">
          <h3>Pickup Location</h3>
          <p>{trip.pickupLocation.address}</p>
        </div>
      </div>

      <div className="trip-detail">
        <MapPin size={18} />
        <div className="detail-content">
          <h3>Dropoff Location</h3>
          <p>{trip.dropoffLocation.address}</p>
        </div>
      </div>

      <div className="trip-footer">
        <div className="trip-price">
          <DollarSign size={18} />
          <span>${trip.price.toFixed(2)}</span>
        </div>

        <div className="trip-eta">
          <Clock size={18} />
          <span>Est. {trip.estimatedTime}</span>
        </div>
      </div>

      <div className="trip-actions">{renderActionButton()}</div>
    </div>
  )
}

export default TripDetails

