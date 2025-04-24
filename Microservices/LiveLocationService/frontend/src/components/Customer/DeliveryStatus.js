const DeliveryStatus = ({ trip, tripStatus, driverLocation }) => {
  const getStatusText = () => {
    switch (tripStatus) {
      case "assigned":
        return "Driver is heading to pickup location"
      case "pickup":
        return "Driver is at pickup location"
      case "delivering":
        return "Package picked up, on the way to delivery"
      case "completed":
        return "Delivery completed"
      default:
        return "Tracking your package"
    }
  }

  const getStatusPercentage = () => {
    switch (tripStatus) {
      case "assigned":
        return 25
      case "pickup":
        return 50
      case "delivering":
        return 75
      case "completed":
        return 100
      default:
        return 0
    }
  }

  // Calculate estimated arrival time based on driver location
  const calculateETA = () => {
    if (!driverLocation) return trip.estimatedDeliveryTime

    // Simple distance-based calculation (very rough estimate)
    const destination =
      tripStatus === "assigned" || tripStatus === "pickup" ? trip.pickupLocation : trip.dropoffLocation

    const distance = getDistance(driverLocation, destination)
    const averageSpeed = 30 // km/h
    const timeInHours = distance / averageSpeed
    const timeInMinutes = Math.round(timeInHours * 60)

    return timeInMinutes <= 0 ? "Arriving now" : `${timeInMinutes} minutes`
  }

  // Calculate distance between two points using Haversine formula
  const getDistance = (point1, point2) => {
    const R = 6371 // Earth's radius in km
    const dLat = deg2rad(point2.lat - point1.lat)
    const dLng = deg2rad(point2.lng - point1.lng)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(point1.lat)) * Math.cos(deg2rad(point2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distance in km
    return distance
  }

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180)
  }

  return (
    <div className="delivery-status">
      <h2>Delivery Status</h2>

      <div className="status-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${getStatusPercentage()}%` }}></div>
        </div>
        <div className="status-text">{getStatusText()}</div>
      </div>

      <div className="driver-info">
        <h3>Driver Information</h3>
        <p>
          <strong>Name:</strong> {trip.driverName}
        </p>
        <p>
          <strong>Phone:</strong> {trip.driverPhone}
        </p>
      </div>

      <div className="package-info">
        <h3>Package Information</h3>
        <p>{trip.packageDetails}</p>
      </div>

      <div className="location-info">
        <h3>Pickup Location</h3>
        <p>{trip.pickupLocation.address}</p>

        <h3>Delivery Location</h3>
        <p>{trip.dropoffLocation.address}</p>
      </div>

      <div className="eta-info">
        <h3>Estimated Delivery Time</h3>
        <p>{calculateETA()}</p>
      </div>
    </div>
  )
}

export default DeliveryStatus

