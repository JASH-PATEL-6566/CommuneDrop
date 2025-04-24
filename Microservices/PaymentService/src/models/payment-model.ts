import mongoose, { type Document, Schema } from "mongoose"

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - orderId
 *         - customerId
 *         - paymentMethodId
 *         - paymentIntentId
 *         - amount
 *         - currency
 *         - status
 *       properties:
 *         orderId:
 *           type: string
 *           description: ID of the associated order
 *         customerId:
 *           type: string
 *           description: ID of the customer
 *         paymentMethodId:
 *           type: string
 *           description: ID of the payment method used
 *         paymentIntentId:
 *           type: string
 *           description: Stripe payment intent ID
 *         amount:
 *           type: number
 *           description: Payment amount in cents
 *         currency:
 *           type: string
 *           description: Currency code (e.g., usd)
 *         status:
 *           type: string
 *           description: Payment status
 *         refunded:
 *           type: boolean
 *           description: Whether the payment has been refunded
 *         refundAmount:
 *           type: number
 *           description: Amount refunded (if applicable)
 *         refundId:
 *           type: string
 *           description: ID of the refund (if applicable)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
export interface IPayment extends Document {
  orderId: string
  customerId: string
  paymentMethodId: string
  paymentIntentId: string
  amount: number
  currency: string
  status: string
  refunded: boolean
  refundAmount?: number
  refundId?: string
  createdAt: Date
  updatedAt?: Date
}

const PaymentSchema = new Schema<IPayment>({
  orderId: {
    type: String,
    required: true,
    index: true,
  },
  customerId: {
    type: String,
    required: true,
    index: true,
  },
  paymentMethodId: {
    type: String,
    required: true,
  },
  paymentIntentId: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: "usd",
  },
  status: {
    type: String,
    required: true,
  },
  refunded: {
    type: Boolean,
    default: false,
  },
  refundAmount: {
    type: Number,
  },
  refundId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
})

export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema)

