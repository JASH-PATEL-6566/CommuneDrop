import mongoose, { type Document, Schema } from "mongoose"

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       required:
 *         - email
 *         - stripeCustomerId
 *       properties:
 *         email:
 *           type: string
 *           description: Customer's email address
 *         name:
 *           type: string
 *           description: Customer's name
 *         stripeCustomerId:
 *           type: string
 *           description: Customer's Stripe ID
 *         paymentMethods:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of payment method IDs
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
export interface ICustomer extends Document {
  email: string
  name?: string
  stripeCustomerId: string
  paymentMethods: string[]
  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<ICustomer>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentMethods: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
)

export const CustomerModel = mongoose.model<ICustomer>("Customer", CustomerSchema)

