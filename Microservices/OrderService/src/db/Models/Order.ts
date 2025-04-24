import mongoose, { Schema } from "mongoose"

const orderSchema = new Schema(
  {
    from_address: {
      type: String,
      required: true,
    },
    to_address: {
      type: String,
      required: true,
    },
    user_id: {
      type: String, // Changed from Schema.Types.ObjectId to String
      required: true,
      index: true,
    },
    rider_id: {
      type: String, // Changed from Schema.Types.ObjectId to String
      required: false,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "ORDER PLACED",
        "ORDER CONFIRMED",
        "PAYMENT RECEIVED",
        "AWAITING PICKUP",
        "OUT FOR DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "ORDER PLACED",
    },
    pricing_details: {
      cost: {
        type: Number,
        required: true,
      },
      tax: {
        type: Number,
        required: true,
      },
      total_cost: {
        type: Number,
        required: true,
      },
      rider_commission: {
        type: Number,
        required: true,
      },
    },
    package_weight: {
      type: Number,
      required: true,
    },
    vehicle_type: {
      type: String,
      enum: ["BIKE", "CAR", "TRUCK", "WALK"],
      required: true,
    },
    delivery_instructions: {
      type: String,
      required: false,
    },
    distance: {
      type: Number,
      required: true,
    },
    time: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String, // Changed from Schema.Types.ObjectId to String
      required: false,
      index: true,
    },
    refundId: {
      type: String, // Changed from Schema.Types.ObjectId to String
      required: false,
      index: true,
    },
  },
  { timestamps: true },
)

export const Order = mongoose.model("Order", orderSchema)

