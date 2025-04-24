import LocationUpdate from "../models/LocationUpdate.js"
import Trip from "../models/Trip.js"

export const processLocationUpdate = async (tripId, location, timestamp) => {
  try {
    console.log(`Processing location update for trip ${tripId}:`, location)
    const locationUpdate = new LocationUpdate({
      tripId,
      location,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    })
    try {
      await locationUpdate.save()
      console.log(`Location update for trip ${tripId} saved to database`)
    } catch (error) {
      console.error("Error saving location update to database:", error)
    }
    try {
      const updatedTrip = await Trip.findOneAndUpdate(
        { id: tripId },
        {
          currentLocation: location,
          updatedAt: new Date(),
        },
        {
          new: true,
          upsert: false,
        },
      )
      if (updatedTrip) {
        console.log(`Updated current location for trip ${tripId}`)
      } else {
        console.log(`Trip ${tripId} not found, couldn't update location`)
      }
    } catch (tripError) {
      console.error("Error updating trip with current location:", tripError)
    }
    return true
  } catch (error) {
    console.error("Error in processLocationUpdate:", error)
    return false
  }
}

