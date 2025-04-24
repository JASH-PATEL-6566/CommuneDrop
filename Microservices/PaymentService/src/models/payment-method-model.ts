import mongoose, { type Document, Schema } from "mongoose"

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentMethod:
 *       type: object
 *       required:
 *         - customerId
 *         - stripeCustomerId
 *         - paymentMethodId
 *         - cardholderName
 *         - last4
 *         - cardType
 *         - expiryDate
 *       properties:
 *         customerId:
 *           type: string
 *           description: Internal customer ID
 *         stripeCustomerId:
 *           type: string
 *           description: Stripe customer ID
 *         paymentMethodId:
 *           type: string
 *           description: Stripe payment method ID
 *         cardholderName:
 *           type: string
 *           description: Name on the card
 *         last4:
 *           type: string
 *           description: Last 4 digits of the card
 *         cardType:
 *           type: string
 *           description: Type of card (visa, mastercard, etc.)
 *         expiryDate:
 *           type: string
 *           description: Card expiry date (MM/YY)
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default payment method
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
export interface IPaymentMethod extends Document {
  customerId: string
  stripeCustomerId: string
  paymentMethodId: string
  cardholderName: string
  last4: string
  cardType: string
  expiryDate: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
      index: true,
    },
    paymentMethodId: {
      type: String,
      required: true,
      unique: true,
    },
    cardholderName: {
      type: String,
      required: true,
    },
    last4: {
      type: String,
      required: true,
    },
    cardType: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

export const PaymentMethodModel = mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema)

