import mongoose from "mongoose"

const locationSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
})

const tripSchema = new mongoose.Schema({
  // Add an id field that's separate from MongoDB's _id
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  driverId: {
    type: String,
    required: true,
  },
  customerId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["assigned", "pickup", "delivering", "completed"],
    default: "assigned",
  },
  pickupLocation: {
    type: locationSchema,
    required: true,
  },
  dropoffLocation: {
    type: locationSchema,
    required: true,
  },
  currentLocation: {
    type: locationSchema,
  },
  packageDetails: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt timestamp before saving
tripSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

// Add error handling for model creation
let Trip
try {
  // Check if model already exists to prevent model overwrite warnings
  Trip = mongoose.models.Trip || mongoose.model("Trip", tripSchema)
} catch (error) {
  console.error("Error creating Trip model:", error)
  // Fallback to creating the model anyway
  Trip = mongoose.model("Trip", tripSchema)
}

export default Trip

