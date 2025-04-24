import mongoose from "mongoose"

const locationUpdateSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true,
    index: true,
  },
  location: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

locationUpdateSchema.index({ tripId: 1, timestamp: -1 })
let LocationUpdate
try {
  LocationUpdate = mongoose.models.LocationUpdate || mongoose.model("LocationUpdate", locationUpdateSchema)
} catch (error) {
  console.error("Error creating LocationUpdate model:", error)
  LocationUpdate = mongoose.model("LocationUpdate", locationUpdateSchema)
}
export default LocationUpdate

