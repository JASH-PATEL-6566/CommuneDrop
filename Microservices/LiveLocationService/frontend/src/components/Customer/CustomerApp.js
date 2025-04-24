"use client"

import { useState, useEffect } from "react"
import { io } from "socket.io-client"
import CustomerMap from "./CustomerMap"
import DeliveryStatus from "./DeliveryStatus"
import "../../styles/Customer.css"

// Use the port from environment variable or default to 5000
const PORT = process.env.PORT || 5000
// Use the socket URL from environment variable or default to the Ingress URL
const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || `http://k8s-default-liveapig-f10a6b9e65-336617037.us-east-1.elb.amazonaws.com/`

// Create socket outside component to prevent recreation on re-renders
const socket = io(SOCKET_URL, {
  path: "/socket.io", // Explicitly set the socket.io path to match Ingress
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  transports: ["websocket", "polling"], // Try websocket first, then fall back to polling
  withCredentials: false, // Disable credentials for simpler CORS handling
})

// Add this for debugging socket connection issues
console.log(`Attempting to connect to Socket.io server at: ${SOCKET_URL} with path: /socket.io`)

const CustomerApp = () => {
  // Initialize with a default driver location in Halifax
  const [driverLocation, setDriverLocation] = useState(null)
  const [tripStatus, setTripStatus] = useState("waiting") // Start with waiting until we get real data
  const [trip, setTrip] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [kafkaEnabled, setKafkaEnabled] = useState(false)
  const [locationSource, setLocationSource] = useState("socket")

  // Connect to socket - only set up listeners once
  useEffect(() => {
    console.log("Setting up socket connection for customer...")

    // Set up socket event listeners
    const handleConnect = () => {
      console.log("Customer connected to server with socket ID:", socket.id)
      setSocketConnected(true)

      // Get customer ID from URL or localStorage, or use a default
      const customerId =
        new URLSearchParams(window.location.search).get("customerId") || localStorage.getItem("customerId") || "C001"

      // Get trip ID from URL or localStorage, or use a default
      const tripId = new URLSearchParams(window.location.search).get("tripId") || localStorage.getItem("tripId")

      if (tripId) {
        socket.emit("customerConnected", { customerId, tripId })

        // Request trip data
        socket.emit("getTripDetails", { tripId })

        // Request the latest driver location
        console.log("Requesting initial driver location")
        socket.emit("requestDriverLocation", { tripId })
      } else {
        console.error("No trip ID available")
      }

      // Request server configuration
      socket.emit("getServerConfig")
    }

    const handleConnectError = (error) => {
      console.error("Socket connection error:", error)
      setSocketConnected(false)
    }

    const handleDisconnect = (reason) => {
      console.log("Socket disconnected:", reason)
      setSocketConnected(false)
    }

    const handleDriverLocationUpdate = (data) => {
      console.log("Customer received driver location update:", data)

      if (data && data.location && typeof data.location.lat === "number" && typeof data.location.lng === "number") {
        console.log(
          "Setting valid driver location:",
          `lat: ${data.location.lat.toFixed(7)}, lng: ${data.location.lng.toFixed(7)}`,
        )
        setDriverLocation(data.location)

        // Track the source of the location update
        if (data.source) {
          setLocationSource(data.source)
          if (data.source === "kafka") {
            setKafkaEnabled(true)
          }
        }
      } else {
        console.error("Received invalid driver location data:", data)
      }
    }

    const handleTripStatusUpdate = (data) => {
      console.log("Customer received trip status update:", data)
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

    const handleTripDetails = (tripData) => {
      console.log("Received trip details:", tripData)
      if (tripData) {
        setTrip(tripData)
        setTripStatus(tripData.status || "assigned")
      }
    }

    // Add event listeners
    socket.on("connect", handleConnect)
    socket.on("connect_error", handleConnectError)
    socket.on("disconnect", handleDisconnect)
    socket.on("driverLocationUpdate", handleDriverLocationUpdate)
    socket.on("tripStatusUpdate", handleTripStatusUpdate)
    socket.on("serverConfig", handleServerConfig)
    socket.on("tripDetails", handleTripDetails)

    // If socket is already connected, emit connection info
    if (socket.connected) {
      handleConnect()
    }

    // Cleanup on unmount - remove event listeners but don't disconnect
    return () => {
      console.log("Removing socket event listeners for customer")
      socket.off("connect", handleConnect)
      socket.off("connect_error", handleConnectError)
      socket.off("disconnect", handleDisconnect)
      socket.off("driverLocationUpdate", handleDriverLocationUpdate)
      socket.off("tripStatusUpdate", handleTripStatusUpdate)
      socket.off("serverConfig", handleServerConfig)
      socket.off("tripDetails", handleTripDetails)
      // Don't disconnect the socket here
    }
  }, [])

  // Periodically request driver location updates when socket is connected
  useEffect(() => {
    if (!socketConnected || !trip?.id) return

    console.log("Setting up periodic location requests")

    const intervalId = setInterval(() => {
      console.log("Requesting driver location update")
      socket.emit("requestDriverLocation", { tripId: trip.id })
    }, 3000) // Every 3 seconds

    return () => clearInterval(intervalId)
  }, [trip?.id, socketConnected])

  return (
    <div className="customer-app">
      <header className="customer-header">
        <h1>Package Delivery Tracker</h1>
        {trip && <div className="trip-id">Trip #{trip.id}</div>}
      </header>

      <div className="customer-content">
        <div className="map-container">
          {trip ? (
            <CustomerMap
              driverLocation={driverLocation}
              pickupLocation={trip.pickupLocation}
              dropoffLocation={trip.dropoffLocation}
              tripStatus={tripStatus}
            />
          ) : (
            <div className="loading-message">
              <p>Loading trip data...</p>
            </div>
          )}

          {/* Debug info - only visible in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="debug-panel">
              <div className="debug-info">
                <h4>Driver Location:</h4>
                <p>
                  {driverLocation
                    ? `{"lat":${driverLocation.lat.toFixed(7)},"lng":${driverLocation.lng.toFixed(7)}}`
                    : "Not available"}
                </p>
                <h4>Status: {tripStatus}</h4>
                <h4>Socket Connected: {socketConnected ? "Yes" : "No"}</h4>
                <h4>Socket ID: {socket.id || "Not connected"}</h4>
                <h4>Kafka Enabled: {kafkaEnabled ? "Yes" : "No"}</h4>
                <h4>Location Source: {locationSource}</h4>
              </div>
            </div>
          )}
        </div>

        <div className="status-container">
          {trip ? (
            <DeliveryStatus trip={trip} tripStatus={tripStatus} driverLocation={driverLocation} />
          ) : (
            <div className="loading-message">
              <p>Loading trip data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerApp

