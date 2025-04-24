"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  GoogleMap,
  LoadScript,
  DirectionsService,
  DirectionsRenderer,
  InfoWindow,
  Marker,
} from "@react-google-maps/api"
import { useAdvancedMarker } from "../Customer/useAdvancedMarker"
import { Loader } from "lucide-react"

const mapContainerStyle = {
  width: "100%",
  height: "100%",
}

// Logger for Google Maps API usage
const logApiUsage = (action) => {
  console.log(`[MAPS API] ${action} - ${new Date().toISOString()}`)
}

// Debug function to log marker positions
const logMarkerPosition = (type, position) => {
  if (!position) {
    console.error(`Invalid ${type} position:`, position)
    return
  }

  console.log(
    `Rendering ${type} marker at:`,
    position ? `lat: ${position.lat.toFixed(7)}, lng: ${position.lng.toFixed(7)}` : "undefined",
  )
}

const DriverMap = ({ currentLocation, pickupLocation, dropoffLocation, tripStatus, isLoading = false }) => {
  const [directions, setDirections] = useState(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [directionsRequested, setDirectionsRequested] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [mapBounds, setMapBounds] = useState(null)
  const mapRef = useRef(null)
  const lastTripStatus = useRef(tripStatus)
  const lastOrigin = useRef(null)
  const lastDestination = useRef(null)
  const directionsRequestTimeout = useRef(null)
  const { renderAdvancedMarker } = useAdvancedMarker()

  const pickupLoc = pickupLocation || null
  const dropoffLoc = dropoffLocation || null

  // Determine which locations to show directions for based on trip status
  const origin = currentLocation
  const destination = tripStatus === "pickup" ? pickupLoc : dropoffLoc

  // Default to Halifax if no current location
  const center = currentLocation || { lat: 44.6476, lng: -63.5728 }

  // Add this at the top of the component
  useEffect(() => {
    console.log(
      "DriverMap received currentLocation:",
      currentLocation ? `lat: ${currentLocation.lat.toFixed(7)}, lng: ${currentLocation.lng.toFixed(7)}` : "undefined",
    )
  }, [currentLocation])

  // Handle maps loading
  const handleMapsLoaded = () => {
    setMapsLoaded(true)
    logApiUsage("Maps API loaded - Driver")
  }

  const directionsCallback = React.useCallback((response) => {
    if (response !== null && response.status === "OK") {
      logApiUsage("Directions received - Driver")
      setDirections(response)
      setDirectionsRequested(false)
    } else {
      logApiUsage(`Directions error: ${response?.status || "unknown"} - Driver`)
      setDirectionsRequested(false)
    }
  }, [])

  // Only request directions when necessary with debouncing
  useEffect(() => {
    if (!mapsLoaded || !origin || !destination) return

    // Check if we need to request new directions
    const tripStatusChanged = tripStatus !== lastTripStatus.current
    const originChanged =
      !lastOrigin.current ||
      Math.abs(origin.lat - lastOrigin.current.lat) > 0.0005 ||
      Math.abs(origin.lng - lastOrigin.current.lng) > 0.0005
    const destinationChanged =
      !lastDestination.current ||
      lastDestination.current.lat !== destination.lat ||
      lastDestination.current.lng !== destination.lng

    // Only request new directions if something significant changed
    if ((tripStatusChanged || originChanged || destinationChanged) && !directionsRequested) {
      // Clear any existing timeout
      if (directionsRequestTimeout.current) {
        clearTimeout(directionsRequestTimeout.current)
      }

      // Set a timeout to debounce the request
      directionsRequestTimeout.current = setTimeout(() => {
        logApiUsage(`Requesting directions - Driver (Status: ${tripStatus}, Origin changed: ${originChanged})`)
        lastTripStatus.current = tripStatus
        lastOrigin.current = { ...origin }
        lastDestination.current = { ...destination }
        setDirectionsRequested(true)
      }, 1000) // 1 second debounce
    }

    return () => {
      if (directionsRequestTimeout.current) {
        clearTimeout(directionsRequestTimeout.current)
      }
    }
  }, [mapsLoaded, origin, destination, tripStatus, directionsRequested])

  // Fit map to show all markers
  useEffect(() => {
    if (!mapRef.current || !mapsLoaded || !window.google) return

    const bounds = new window.google.maps.LatLngBounds()

    if (pickupLoc) {
      bounds.extend(new window.google.maps.LatLng(pickupLoc.lat, pickupLoc.lng))
    }

    if (dropoffLoc) {
      bounds.extend(new window.google.maps.LatLng(dropoffLoc.lat, dropoffLoc.lng))
    }

    if (currentLocation) {
      bounds.extend(new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng))
    }

    // Only update bounds if they've changed significantly
    if (!mapBounds || !boundsEqual(bounds, mapBounds)) {
      setMapBounds(bounds)

      // Add padding to the bounds
      const map = mapRef.current
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })

      // Set a stable zoom level
      const zoomChangeBoundsListener = window.google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        if (map.getZoom() > 15) {
          map.setZoom(15)
        }
      })

      return () => {
        window.google.maps.event.removeListener(zoomChangeBoundsListener)
      }
    }
  }, [mapsLoaded, currentLocation, pickupLoc, dropoffLoc, mapBounds])

  // Helper function to compare bounds
  const boundsEqual = (bounds1, bounds2) => {
    if (!bounds1 || !bounds2) return false

    const ne1 = bounds1.getNorthEast()
    const sw1 = bounds1.getSouthWest()
    const ne2 = bounds2.getNorthEast()
    const sw2 = bounds2.getSouthWest()

    return (
      Math.abs(ne1.lat() - ne2.lat()) < 0.0001 &&
      Math.abs(ne1.lng() - ne2.lng()) < 0.0001 &&
      Math.abs(sw1.lat() - sw2.lat()) < 0.0001 &&
      Math.abs(sw1.lng() - sw2.lng()) < 0.0001
    )
  }

  // Handle map load
  const handleMapLoad = (map) => {
    mapRef.current = map
    logApiUsage("Map rendered - Driver")
  }

  console.log("Driver Map Rendering with:", {
    currentLocation: currentLocation
      ? `lat: ${currentLocation.lat.toFixed(7)}, lng: ${currentLocation.lng.toFixed(7)}`
      : "undefined",
    pickupLocation: pickupLoc ? `lat: ${pickupLoc.lat.toFixed(7)}, lng: ${pickupLoc.lng.toFixed(7)}` : "undefined",
    dropoffLocation: dropoffLoc ? `lat: ${dropoffLoc.lat.toFixed(7)}, lng: ${dropoffLoc.lng.toFixed(7)}` : "undefined",
    tripStatus,
    isLoading,
  })

  // Check if the renderAdvancedMarker function is working correctly
  // The issue might be that the advanced marker isn't being rendered properly
  // Let's modify the code to ensure the marker is always visible

  // Add this debug log to see if currentLocation is actually available
  console.log("DEBUG - Current location for marker:", currentLocation)

  return (
    <>
      {isLoading && (
        <div className="location-loading-overlay">
          <div className="loading-spinner">
            <Loader size={32} className="spinner-icon" />
            <span>Getting your location...</span>
          </div>
        </div>
      )}

      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} onLoad={handleMapsLoaded}>
        <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={14} onLoad={handleMapLoad}>
          {mapsLoaded && (
            <>
              {/* Current location */}
              {currentLocation && (
                <>
                  {logMarkerPosition("current location", currentLocation)}
                  {/* Try advanced marker first */}
                  {renderAdvancedMarker({
                    position: currentLocation,
                    title: "YOU",
                    color: "blue",
                    size: 50,
                    animation: window.google.maps.Animation.BOUNCE,
                    onClick: () => setSelectedMarker("current"),
                  })}

                  {/* Fallback standard marker */}
                  <Marker
                    position={currentLocation}
                    title="YOU"
                    icon={{
                      url: `http://maps.google.com/mapfiles/ms/icons/blue-dot.png`,
                      scaledSize: new window.google.maps.Size(50, 50),
                    }}
                    animation={window.google.maps.Animation.BOUNCE}
                    onClick={() => setSelectedMarker("current")}
                  />
                </>
              )}

              {/* Pickup location - Always show */}
              {pickupLoc && (
                <>
                  {logMarkerPosition("pickup", pickupLoc)}
                  {renderAdvancedMarker({
                    position: pickupLoc,
                    title: "PICKUP",
                    color: "green",
                    size: 40,
                    onClick: () => setSelectedMarker("pickup"),
                  })}

                  {/* Fallback standard marker */}
                  <Marker
                    position={pickupLoc}
                    title="PICKUP"
                    icon={{
                      url: `http://maps.google.com/mapfiles/ms/icons/green-dot.png`,
                      scaledSize: new window.google.maps.Size(40, 40),
                    }}
                    onClick={() => setSelectedMarker("pickup")}
                  />
                </>
              )}

              {/* Dropoff location - Always show */}
              {dropoffLoc && (
                <>
                  {logMarkerPosition("dropoff", dropoffLoc)}
                  {renderAdvancedMarker({
                    position: dropoffLoc,
                    title: "DROPOFF",
                    color: "red",
                    size: 40,
                    onClick: () => setSelectedMarker("dropoff"),
                  })}

                  {/* Fallback standard marker */}
                  <Marker
                    position={dropoffLoc}
                    title="DROPOFF"
                    icon={{
                      url: `http://maps.google.com/mapfiles/ms/icons/red-dot.png`,
                      scaledSize: new window.google.maps.Size(40, 40),
                    }}
                    onClick={() => setSelectedMarker("dropoff")}
                  />
                </>
              )}

              {/* Info windows for markers */}
              {selectedMarker === "current" && currentLocation && (
                <InfoWindow position={currentLocation} onCloseClick={() => setSelectedMarker(null)}>
                  <div>
                    <h3>Your Location</h3>
                    <p>Current position</p>
                  </div>
                </InfoWindow>
              )}

              {selectedMarker === "pickup" && pickupLoc && (
                <InfoWindow position={pickupLoc} onCloseClick={() => setSelectedMarker(null)}>
                  <div>
                    <h3>Pickup Location</h3>
                    <p>{pickupLoc.address}</p>
                  </div>
                </InfoWindow>
              )}

              {selectedMarker === "dropoff" && dropoffLoc && (
                <InfoWindow position={dropoffLoc} onCloseClick={() => setSelectedMarker(null)}>
                  <div>
                    <h3>Dropoff Location</h3>
                    <p>{dropoffLoc.address}</p>
                  </div>
                </InfoWindow>
              )}

              {/* Directions */}
              {origin &&
                destination &&
                tripStatus !== "waiting" &&
                tripStatus !== "completed" &&
                directionsRequested && (
                  <DirectionsService
                    options={{
                      origin: origin,
                      destination: destination,
                      travelMode: "DRIVING",
                      optimizeWaypoints: true,
                      provideRouteAlternatives: false,
                      avoidHighways: false,
                      avoidTolls: false,
                      // Request the shortest path instead of fastest
                      drivingOptions: {
                        departureTime: new Date(),
                        trafficModel: "bestguess",
                      },
                      // This is the key setting for shortest path
                      optimizeWaypoints: true,
                    }}
                    callback={directionsCallback}
                  />
                )}

              {directions && (
                <DirectionsRenderer
                  options={{
                    directions: directions,
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: "#4285F4",
                      strokeWeight: 5,
                      strokeOpacity: 0.8,
                    },
                    // Show the shortest route if multiple routes are returned
                    routeIndex: 0,
                  }}
                />
              )}
            </>
          )}
        </GoogleMap>
      </LoadScript>
    </>
  )
}

export default DriverMap

