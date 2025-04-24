import express from "express"
import LocationUpdate from "../models/LocationUpdate.js"

const router = express.Router()

// Get location history for a trip
router.get("/trip/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params
    const { limit = 100 } = req.query

    const locationUpdates = await LocationUpdate.find({ tripId })
      .sort({ timestamp: -1 })
      .limit(Number.parseInt(limit))
      .exec()

    res.json(locationUpdates)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get latest location for a trip
router.get("/trip/:tripId/latest", async (req, res) => {
  try {
    const { tripId } = req.params

    const latestLocation = await LocationUpdate.findOne({ tripId }).sort({ timestamp: -1 }).exec()

    if (!latestLocation) {
      return res.status(404).json({ message: "No location updates found for this trip" })
    }

    res.json(latestLocation)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Store a new location update
router.post("/", async (req, res) => {
  try {
    const { tripId, location } = req.body

    if (!tripId || !location || !location.lat || !location.lng) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const locationUpdate = new LocationUpdate({
      tripId,
      location,
    })

    const savedLocation = await locationUpdate.save()
    res.status(201).json(savedLocation)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

export default router

