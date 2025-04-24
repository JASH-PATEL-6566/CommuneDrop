"use client"

import { useEffect, useState } from "react"
import { Marker } from "@react-google-maps/api"

export const useAdvancedMarker = () => {
  const [advancedMarkersSupported, setAdvancedMarkersSupported] = useState(false)

  useEffect(() => {
    // Check if AdvancedMarkerElement is available when Google Maps is loaded
    if (
      window.google &&
      window.google.maps &&
      window.google.maps.marker &&
      window.google.maps.marker.AdvancedMarkerElement
    ) {
      setAdvancedMarkersSupported(true)
      console.log("Advanced markers are supported")
    } else {
      console.log("Advanced markers are NOT supported")
    }
  }, [])

  const renderAdvancedMarker = ({ position, title, color, size, animation, onClick }) => {
    console.log("renderAdvancedMarker called with position:", position)

    if (!position || typeof position.lat !== "number" || typeof position.lng !== "number") {
      console.error("Invalid marker position:", position)
      return null
    }

    if (advancedMarkersSupported && window.google && window.google.maps.marker) {
      // Use AdvancedMarkerElement when available
      try {
        const { AdvancedMarkerElement } = window.google.maps.marker

        // Create a pin element with the specified color
        const pinElement = document.createElement("div")
        pinElement.className = "custom-marker"
        pinElement.style.width = `${size}px`
        pinElement.style.height = `${size}px`
        pinElement.style.borderRadius = "50%"
        pinElement.style.backgroundColor = getColorCode(color)
        pinElement.style.border = "2px solid white"
        pinElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)"
        pinElement.style.cursor = "pointer"

        // Add label
        const labelElement = document.createElement("div")
        labelElement.className = "marker-label"
        labelElement.style.position = "absolute"
        labelElement.style.top = "-25px"
        labelElement.style.left = "50%"
        labelElement.style.transform = "translateX(-50%)"
        labelElement.style.backgroundColor = "rgba(0,0,0,0.7)"
        labelElement.style.color = "white"
        labelElement.style.padding = "2px 6px"
        labelElement.style.borderRadius = "4px"
        labelElement.style.fontSize = "12px"
        labelElement.style.fontWeight = "bold"
        labelElement.style.whiteSpace = "nowrap"
        labelElement.textContent = title

        pinElement.appendChild(labelElement)

        // Add animation if specified
        if (animation === window.google.maps.Animation.BOUNCE) {
          pinElement.style.animation = "bounce 1s infinite"
        }

        // Create the advanced marker
        const advancedMarker = new AdvancedMarkerElement({
          position,
          content: pinElement,
          title,
        })

        // Add click handler
        if (onClick) {
          advancedMarker.addListener("click", onClick)
        }

        console.log("Advanced marker created successfully")
        return advancedMarker
      } catch (error) {
        console.error("Error creating advanced marker:", error)
        return null
      }
    } else {
      // Fallback to regular Marker when AdvancedMarkerElement is not available
      console.log("Using fallback regular marker")
      return (
        <Marker
          position={position}
          icon={{
            url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
            scaledSize: new window.google.maps.Size(size, size),
            labelOrigin: new window.google.maps.Point(size / 2, -10),
          }}
          label={{
            text: title,
            color: "white",
            fontWeight: "bold",
            fontSize: "12px",
            className: "marker-label",
          }}
          onClick={onClick}
          animation={animation}
        />
      )
    }
  }

  // Helper function to get color code
  const getColorCode = (colorName) => {
    const colorMap = {
      blue: "#4285F4",
      red: "#EA4335",
      green: "#34A853",
      yellow: "#FBBC05",
    }
    return colorMap[colorName] || colorMap.blue
  }

  return { renderAdvancedMarker }
}

