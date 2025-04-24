"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { io } from "socket.io-client"
import DriverMap from "./DriverMap"
import DriverHeader from "./DriverHeader"
import DriverStatus from "./DriverStatus"
import TripDetails from "./TripDetails"
import NewOrderCard from "./NewOrderCard"
import NotificationCenter from "./NotificationCenter"
import TripRequestsList from "./TripRequestsList" // Import the new component
import "../../styles/Driver.css"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

// Use the port from environment variable or default to 5000
const PORT = process.env.PORT || 5000
// Use the socket URL from environment variable or default to the Ingress URL
const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || `http://k8s-default-liveapig-f10a6b9e65-336617037.us-east-1.elb.amazonaws.com/`

console.log(`Connecting to Socket.io server at: ${SOCKET_URL}`)
const socket = io(SOCKET_URL, {
  path: "/socket.io", // Explicitly set the socket.io path to match Ingress
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  transports: ["websocket", "polling"],
})

// Default Halifax location as fallback
const DEFAULT_LOCATION = {
  lat: 44.6470226,
  lng: -63.5942508,
}

// Helper function to save location to localStorage
const saveLocationToStorage = (location) => {
  if (location && typeof location.lat === "number" && typeof location.lng === "number") {
    localStorage.setItem("driverLastLocation", JSON.stringify(location))
  }
}

// Helper function to get location from localStorage
const getLocationFromStorage = () => {
  try {
    const savedLocation = localStorage.getItem("driverLastLocation")
    if (savedLocation) {
      return JSON.parse(savedLocation)
    }
  } catch (error) {
    console.error("Error parsing saved location:", error)
  }
  return null
}

const DriverApp = () => {
  // Initialize with saved location or default
  const savedLocation = getLocationFromStorage()
  const [currentLocation, setCurrentLocation] = useState(savedLocation || DEFAULT_LOCATION)
  const [driverStatus, setDriverStatus] = useState("offline") // offline, online
  const [tripStatus, setTripStatus] = useState("waiting") // waiting, pickup, delivering, completed
  const [trip, setTrip] = useState(null)
  const [newOrder, setNewOrder] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [kafkaEnabled, setKafkaEnabled] = useState(false)
  const [issues, setIssues] = useState([])
  const [notifications, setNotifications] = useState([]) // Add state for notifications
  const [showNotifications, setShowNotifications] = useState(false) // Control notification panel visibility
  const [tripRequests, setTripRequests] = useState([]) // Add state for trip requests
  const [isLoadingLocation, setIsLoadingLocation] = useState(!savedLocation)
  const swipeRef = useRef(null)

  // Handle position updates - defined as useCallback to prevent recreation
  const handlePositionUpdate = useCallback(
    (position) => {
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }

      console.log(
        "Driver geolocation update:",
        `lat: ${newLocation.lat.toFixed(7)}, lng: ${newLocation.lng.toFixed(7)}`,
      )

      // Update local state
      setCurrentLocation(newLocation)
      setIsLoadingLocation(false)

      // Save to localStorage for persistence
      saveLocationToStorage(newLocation)

      // Emit location update to server if socket is connected and driver is on a trip
      if (tripStatus !== "waiting" && tripStatus !== "completed" && socketConnected && driverStatus === "online") {
        console.log(
          "Emitting driver location update:",
          `lat: ${newLocation.lat.toFixed(7)}, lng: ${newLocation.lng.toFixed(7)}`,
        )
        socket.emit("driverLocationUpdate", {
          tripId: trip?.id,
          location: newLocation,
        })
      }
    },
    [tripStatus, trip?.id, socketConnected, driverStatus],
  )

  // Error handling function - defined as useCallback to prevent recreation
  const handleError = useCallback(
    (error) => {
      console.error("Error getting location:", error)
      setIssues((prev) => [...prev, "Geolocation error: " + error.message])
      setIsLoadingLocation(false)

      // Use saved location or default Halifax location as fallback
      const fallbackLocation = getLocationFromStorage() || DEFAULT_LOCATION

      console.log(
        "Using fallback location:",
        `lat: ${fallbackLocation.lat.toFixed(7)}, lng: ${fallbackLocation.lng.toFixed(7)}`,
      )

      setCurrentLocation(fallbackLocation)

      // Emit the fallback location if socket is connected
      if (tripStatus !== "waiting" && tripStatus !== "completed" && socketConnected && driverStatus === "online") {
        console.log(
          "Emitting fallback location:",
          `lat: ${fallbackLocation.lat.toFixed(7)}, lng: ${fallbackLocation.lng.toFixed(7)}`,
        )
        socket.emit("driverLocationUpdate", {
          tripId: trip?.id,
          location: fallbackLocation,
        })
      }
    },
    [tripStatus, trip?.id, socketConnected, driverStatus],
  )

  // Watch driver's location with geolocation API
  useEffect(() => {
    console.log("Setting up geolocation for driver...")

    let watchId

    // Try to get the current position first
    if (navigator.geolocation) {
      console.log("Geolocation API is available, requesting position...")
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Geolocation success:", position.coords)
          handlePositionUpdate(position)
        },
        (error) => {
          console.error("Geolocation error:", error)
          handleError(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )

      // Then set up continuous watching with high accuracy
      watchId = navigator.geolocation.watchPosition(handlePositionUpdate, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      })
      console.log("Geolocation watch initiated with ID:", watchId)
    } else {
      console.error("Geolocation is not supported by this browser")
      setIssues((prev) => [...prev, "Geolocation not supported by this browser"])
      handleError(new Error("Geolocation not supported"))
    }

    // Cleanup on unmount
    return () => {
      if (watchId) {
        console.log("Cleaning up geolocation watch:", watchId)
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [handlePositionUpdate, handleError])

  // Connect to socket - only set up listeners once
  useEffect(() => {
    console.log("Setting up socket connection for driver...")

    // Set up socket event listeners
    const handleConnect = () => {
      console.log("Driver connected to server with socket ID:", socket.id)
      setSocketConnected(true)

      socket.emit("driverConnected", { driverId: "D001", tripId: trip?.id })

      // Send initial location if available
      if (currentLocation && driverStatus === "online") {
        console.log(
          "Sending initial location on connect:",
          `lat: ${currentLocation.lat.toFixed(7)}, lng: ${currentLocation.lng.toFixed(7)}`,
        )
        socket.emit("driverLocationUpdate", {
          tripId: trip?.id,
          location: currentLocation,
        })
      }

      // Request server configuration
      socket.emit("getServerConfig")
    }

    const handleConnectError = (error) => {
      console.error("Socket connection error:", error)
      setSocketConnected(false)
      setIssues((prev) => [...prev, "Socket connection error: " + (error.message || "Unknown error")])
    }

    const handleDisconnect = (reason) => {
      console.log("Socket disconnected:", reason)
      setSocketConnected(false)
      setIssues((prev) => [...prev, "Socket disconnected: " + reason])
    }

    const handleNewOrder = (order) => {
      console.log("New order received:", order)
      if (driverStatus === "online" && tripStatus === "waiting") {
        setNewOrder(order)
      }
    }

    const handleTripAssigned = (newTrip) => {
      console.log("Driver received trip assignment:", newTrip)
      setTrip(newTrip)
      setTripStatus("pickup")
    }

    const handleTripStatusUpdate = (data) => {
      console.log("Driver received trip status update:", data)
      if (data && data.status) {
        setTripStatus(data.status)
      }

      // Check if the update came from Kafka
      if (data && data.source === "kafka") {
        setKafkaEnabled(true)
      }
    }

    const handleServerConfig = (config) => {
      console.log("Received server configuration:", config)
      if (config && typeof config.kafkaEnabled === "boolean") {
        console.log("Setting Kafka enabled to:", config.kafkaEnabled)
        setKafkaEnabled(config.kafkaEnabled)
      }
    }

    // Handle driver notifications from other microservices
    const handleDriverNotification = (notification) => {
      console.log("Received driver notification:", notification)

      // Check if this is a duplicate notification by comparing with existing ones
      // For delivery requests, check by orderId
      if (notification.type === "delivery_request" && notification.data?.orderId) {
        const isDuplicate = notifications.some(
          (existingNotif) =>
            existingNotif.type === "delivery_request" &&
            existingNotif.data?.orderId === notification.data.orderId &&
            // Consider notifications within 5 seconds as duplicates
            new Date(existingNotif.received).getTime() > Date.now() - 5000,
        )

        if (isDuplicate) {
          console.log("Ignoring duplicate delivery request notification:", notification.data.orderId)
          return
        }
      }

      // Add the notification to our state with a unique ID
      const newNotification = {
        id: Date.now(), // Use timestamp as a simple unique ID
        ...notification,
        read: false,
        received: new Date().toISOString(),
      }

      setNotifications((prev) => [newNotification, ...prev])

      // If it's a delivery request, add it to trip requests
      if (notification.type === "delivery_request" && notification.data) {
        const requestData = notification.data
        const tripRequest = {
          id: requestData.orderId || `REQ-${Date.now()}`,
          orderId: requestData.orderId || `ORDER-${Date.now().toString(36)}`,
          from: requestData.from_address || "Unknown pickup location",
          to: requestData.to_address || "Unknown dropoff location",
          price: requestData.amount || 0,
          timestamp: notification.timestamp || new Date().toISOString(),
          urgent: true,
          pickupLocation: requestData.pickupLocation || {
            lat: 44.643,
            lng: -63.5793,
            address: requestData.from_address || "Unknown pickup location",
          },
          dropoffLocation: requestData.dropoffLocation || {
            lat: 44.6418,
            lng: -63.5784,
            address: requestData.to_address || "Unknown dropoff location",
          },
          userId: requestData.userId || "unknown",
        }

        setTripRequests((prev) => {
          // Check if this request already exists
          const exists = prev.some((req) => req.id === tripRequest.id)
          if (!exists) {
            return [tripRequest, ...prev]
          }
          return prev
        })
      }

      // Show notification panel if it's not already visible
      if (!showNotifications) {
        setShowNotifications(true)
      }
    }

    // Add event listeners
    socket.on("connect", handleConnect)
    socket.on("connect_error", handleConnectError)
    socket.on("disconnect", handleDisconnect)
    socket.on("newOrder", handleNewOrder)
    socket.on("tripAssigned", handleTripAssigned)
    socket.on("tripStatusUpdate", handleTripStatusUpdate)
    socket.on("serverConfig", handleServerConfig)
    socket.on("driverNotification", handleDriverNotification)

    // If socket is already connected, emit connection info
    if (socket.connected) {
      handleConnect()
    }

    // Cleanup on unmount - remove event listeners but don't disconnect
    return () => {
      console.log("Removing socket event listeners for driver")
      socket.off("connect", handleConnect)
      socket.off("connect_error", handleConnectError)
      socket.off("disconnect", handleDisconnect)
      socket.off("newOrder", handleNewOrder)
      socket.off("tripAssigned", handleTripAssigned)
      socket.off("tripStatusUpdate", handleTripStatusUpdate)
      socket.off("serverConfig", handleServerConfig)
      socket.off("driverNotification", handleDriverNotification)
      // Don't disconnect the socket here
    }
  }, [trip?.id, currentLocation, driverStatus, notifications, showNotifications])

  // Send location updates periodically as a backup when socket is connected
  useEffect(() => {
    if (
      !currentLocation ||
      !socketConnected ||
      driverStatus !== "online" ||
      tripStatus === "waiting" ||
      tripStatus === "completed"
    )
      return

    console.log("Setting up periodic location updates")

    const intervalId = setInterval(() => {
      console.log(
        "Sending periodic location update:",
        `lat: ${currentLocation.lat.toFixed(7)}, lng: ${currentLocation.lng.toFixed(7)}`,
      )
      socket.emit("driverLocationUpdate", {
        tripId: trip?.id,
        location: currentLocation,
      })
    }, 3000) // Every 3 seconds

    return () => clearInterval(intervalId)
  }, [currentLocation, trip?.id, socketConnected, driverStatus, tripStatus])

  // Try to restore trip state from localStorage on page load
  useEffect(() => {
    try {
      const savedTrip = localStorage.getItem("currentTrip")
      const savedTripStatus = localStorage.getItem("currentTripStatus")

      if (savedTrip && savedTripStatus) {
        setTrip(JSON.parse(savedTrip))
        setTripStatus(savedTripStatus)
      }
    } catch (error) {
      console.error("Error restoring trip state:", error)
    }
  }, [])

  // Save trip state to localStorage when it changes
  useEffect(() => {
    if (trip) {
      localStorage.setItem("currentTrip", JSON.stringify(trip))
      localStorage.setItem("currentTripStatus", tripStatus)
    } else {
      localStorage.removeItem("currentTrip")
      localStorage.removeItem("currentTripStatus")
    }
  }, [trip, tripStatus])

  const toggleDriverStatus = () => {
    const newStatus = driverStatus === "offline" ? "online" : "offline"
    setDriverStatus(newStatus)

    // If going offline, clear any active trips or orders
    if (newStatus === "offline") {
      if (tripStatus !== "waiting" && tripStatus !== "completed") {
        setIssues((prev) => [...prev, "Trip canceled due to going offline"])
      }
      setTripStatus("waiting")
      setNewOrder(null)
    }

    // Emit status change to server
    socket.emit("driverStatusUpdate", {
      driverId: "D001",
      status: newStatus,
    })
  }

  const acceptOrder = () => {
    if (!newOrder) return

    setTrip(newOrder)
    setTripStatus("pickup")
    setNewOrder(null)

    // Emit trip acceptance to server
    socket.emit("tripAccepted", {
      tripId: newOrder.id,
      driverId: "D001",
    })
  }

  const rejectOrder = () => {
    if (!newOrder) return

    setNewOrder(null)

    // Emit trip rejection to server
    socket.emit("tripRejected", {
      tripId: newOrder.id,
      driverId: "D001",
    })
  }

  // Modify the acceptTripRequest function to properly handle location data
  const acceptTripRequest = (request) => {
    console.log("Accepting trip request:", request)

    // Make sure we have valid location objects with proper coordinates
    const pickupLocation = {
      lat: request.pickupLocation?.lat || 44.643,
      lng: request.pickupLocation?.lng || -63.5793,
      address: request.from || "Unknown pickup location",
    }

    const dropoffLocation = {
      lat: request.dropoffLocation?.lat || 44.6418,
      lng: request.dropoffLocation?.lng || -63.5784,
      address: request.to || "Unknown dropoff location",
    }

    console.log("Using pickup location:", pickupLocation)
    console.log("Using dropoff location:", dropoffLocation)

    // Emit acceptance to server with properly formatted location data and current driver location
    socket.emit("acceptOrderFromNotification", {
      orderId: request.orderId,
      userId: request.userId,
      from_address: request.from,
      to_address: request.to,
      amount: request.price,
      driverId: "D001",
      pickupLocation: pickupLocation,
      dropoffLocation: dropoffLocation,
      currentLocation: currentLocation, // Include the driver's current location
    })

    // Remove from trip requests
    setTripRequests((prev) => prev.filter((req) => req.id !== request.id))
  }

  // Add a function to reject an order with a reason
  const cancelOrder = (orderId, userId, reason = "No drivers are available at the moment.") => {
    console.log("Cancelling order:", orderId, "for user:", userId)

    socket.emit("cancelOrder", {
      orderId,
      userId,
      reason,
    })
  }

  // Update the rejectTripRequest function to use cancelOrder when appropriate
  const rejectTripRequest = (requestId) => {
    console.log("Rejecting trip request:", requestId)

    // Find the request in the trip requests
    const request = tripRequests.find((req) => req.id === requestId)

    if (request && request.userId && request.orderId) {
      // Cancel the order with a reason
      cancelOrder(request.orderId, request.userId, "Driver is unavailable for this trip")
    }

    // Remove from trip requests
    setTripRequests((prev) => prev.filter((req) => req.id !== requestId))
  }

  const updateTripStatus = (newStatus) => {
    console.log("Driver updating trip status to:", newStatus)
    setTripStatus(newStatus)

    // Emit status update to server
    socket.emit("tripStatusUpdate", {
      tripId: trip?.id,
      status: newStatus,
    })

    if (newStatus === "completed") {
      // Reset after a delay
      setTimeout(() => {
        setTripStatus("waiting")
        setTrip(null)
      }, 5000)
    }
  }

  const clearIssues = () => {
    setIssues([])
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  const markNotificationAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="driver-app">
      <DriverHeader
        title="Driver Dashboard"
        tripStatus={tripStatus}
        unreadNotifications={unreadCount}
        toggleNotifications={toggleNotifications}
      />

      <div className="driver-content">
        <div className="driver-sidebar">
          <Link to="/" className="back-button">
            <ArrowLeft size={20} />
            <span>Back</span>
          </Link>

          <DriverStatus status={driverStatus} toggleStatus={toggleDriverStatus} />

          {tripStatus === "waiting" && !newOrder && tripRequests.length === 0 && driverStatus === "online" && (
            <div className="waiting-message">
              <h2>No active trip</h2>
              <p>Waiting for new orders...</p>
            </div>
          )}

          {tripStatus === "waiting" && !newOrder && tripRequests.length === 0 && driverStatus === "offline" && (
            <div className="waiting-message">
              <h2>No active trip</h2>
              <p>Go online to receive orders</p>
            </div>
          )}

          {/* Show trip requests if available */}
          {tripStatus === "waiting" && !newOrder && tripRequests.length > 0 && driverStatus === "online" && (
            <TripRequestsList requests={tripRequests} onAccept={acceptTripRequest} onReject={rejectTripRequest} />
          )}

          {newOrder && (
            <NewOrderCard order={newOrder} onAccept={acceptOrder} onReject={rejectOrder} swipeRef={swipeRef} />
          )}

          {trip && tripStatus !== "waiting" && (
            <TripDetails trip={trip} tripStatus={tripStatus} onUpdateStatus={updateTripStatus} />
          )}
        </div>

        <div className="map-container">
          <DriverMap
            currentLocation={currentLocation}
            pickupLocation={trip?.pickupLocation}
            dropoffLocation={trip?.dropoffLocation}
            tripStatus={tripStatus}
            isLoading={isLoadingLocation}
          />

          {issues.length > 0 && (
            <div className="issues-panel">
              <div className="issues-header">
                <span>
                  {issues.length} {issues.length === 1 ? "issue" : "issues"}
                </span>
                <button onClick={clearIssues}>×</button>
              </div>
              <div className="issues-content">
                {issues.slice(0, 3).map((issue, index) => (
                  <div key={index} className="issue-item">
                    {issue}
                  </div>
                ))}
                {issues.length > 3 && <div className="issue-item">...and {issues.length - 3} more issues</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Center */}
      {showNotifications && (
        <NotificationCenter
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={markNotificationAsRead}
          onClearAll={clearAllNotifications}
        />
      )}
    </div>
  )
}

export default DriverApp

