import dotenv from "dotenv"
import { CustomerModel } from "../models/customer-model"
import { PaymentModel } from "../models/payment-model"
import { PaymentMethodModel } from "../models/payment-method-model"
import { logger } from "../utils"
import { stripeApi } from "../utils/stripe-api"
import { updateOrderStatus } from "./order-service"

dotenv.config()

class StripePaymentProcessor {
  /**
   * Get a customer by email
   */
  async getCustomer(email: string): Promise<{ customerId: string } | null> {
    try {
      // Check if customer exists in our database
      const customer = await CustomerModel.findOne({ email })

      // If customer exists in our database and has a Stripe ID, return it
      if (customer && customer.stripeCustomerId) {
        logger.info(`Found existing customer with email ${email} and Stripe ID ${customer.stripeCustomerId}`)
        return { customerId: customer.stripeCustomerId }
      }

      // If customer exists in our DB but has no Stripe ID, check Stripe
      if (customer) {
        logger.info(`Found customer with email ${email} but no Stripe ID, checking Stripe`)

        // Try to find existing customer in Stripe
        const stripeCustomers = await stripeApi.customers.list({
          email,
          limit: 1,
        })

        if (stripeCustomers.data.length > 0) {
          // Customer exists in Stripe, update our record and return the ID
          const stripeCustomerId = stripeCustomers.data[0].id

          // Update customer with Stripe ID
          customer.stripeCustomerId = stripeCustomerId
          await customer.save()

          logger.info(`Updated existing customer record with Stripe ID ${stripeCustomerId}`)
          return { customerId: stripeCustomerId }
        }
      } else {
        // No customer in our DB, check if they exist in Stripe
        const stripeCustomers = await stripeApi.customers.list({
          email,
          limit: 1,
        })

        if (stripeCustomers.data.length > 0) {
          // Customer exists in Stripe but not in our DB, create a record
          const stripeCustomerId = stripeCustomers.data[0].id
          const stripeCustomer = stripeCustomers.data[0]

          // Create customer in our database
          await CustomerModel.create({
            email,
            name: stripeCustomer.name || undefined,
            stripeCustomerId,
            paymentMethods: [],
          })

          logger.info(`Created customer record for existing Stripe customer with ID ${stripeCustomerId}`)
          return { customerId: stripeCustomerId }
        }
      }

      // Customer not found in our DB or Stripe
      logger.info(`No customer found with email ${email}`)
      return null
    } catch (error) {
      logger.error("Error getting customer:", error)
      throw error
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(email: string, name?: string): Promise<string> {
    try {
      // Check if customer already exists
      const existingCustomer = await this.getCustomer(email)
      if (existingCustomer) {
        logger.info(`Customer with email ${email} already exists, returning existing ID`)
        return existingCustomer.customerId
      }

      // Create new customer in Stripe
      const newStripeCustomer = await stripeApi.customers.create({
        email,
        name,
        metadata: {
          source: "node_api",
          external_id: `user_${email.split("@")[0]}`,
        },
      })

      const stripeCustomerId = newStripeCustomer.id
      logger.info(`Created new Stripe customer with ID ${stripeCustomerId}`)

      try {
        // Create new customer in our database
        await CustomerModel.create({
          email,
          name,
          stripeCustomerId,
          paymentMethods: [],
        })
        logger.info(`Created new customer record with email ${email} and Stripe ID ${stripeCustomerId}`)
      } catch (error: any) {
        // If we get a duplicate key error, try to find and update the customer instead
        if (error.code === 11000 && error.keyPattern?.email) {
          logger.warn(`Duplicate key error for email ${email}, trying to find and update instead`)
          await CustomerModel.findOneAndUpdate(
            { email },
            {
              stripeCustomerId,
              ...(name && { name }),
            },
            { new: true },
          )
          logger.info(`Updated customer with email ${email} after duplicate key error`)
        } else {
          // If it's not a duplicate key error, rethrow
          throw error
        }
      }

      return stripeCustomerId
    } catch (error) {
      logger.error("Error creating customer:", error)
      throw error
    }
  }

  /**
   * List all payment methods for a customer
   */
  async listPaymentMethods(customerId: string) {
    try {
      // First check our database for stored payment methods
      const storedPaymentMethods = await PaymentMethodModel.find({ stripeCustomerId: customerId })

      if (storedPaymentMethods.length > 0) {
        return storedPaymentMethods.map((pm) => ({
          payment_method_id: pm.paymentMethodId,
          card_last4: pm.last4,
          card_brand: pm.cardType,
          cardholder_name: pm.cardholderName,
          expiry_date: pm.expiryDate,
          is_default: pm.isDefault,
        }))
      }

      // If no stored methods, fall back to Stripe
      const paymentMethods = await stripeApi.paymentMethods.list({
        customer: customerId,
        type: "card",
      })

      return paymentMethods.data.map((pm) => ({
        payment_method_id: pm.id,
        card_last4: pm.card?.last4,
        card_brand: pm.card?.brand,
        is_default: false,
      }))
    } catch (error) {
      logger.error("Error listing payment methods:", error)
      throw error
    }
  }

  /**
   * Add a new payment method to a Stripe customer
   */
  async addPaymentMethod(customerId: string, paymentMethodId: string) {
    try {
      // Attach payment method to customer
      await stripeApi.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      })

      // Get payment method details
      const paymentMethod = await stripeApi.paymentMethods.retrieve(paymentMethodId)

      // Save payment method to database
      await CustomerModel.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { $addToSet: { paymentMethods: paymentMethodId } },
      )

      return {
        payment_method_id: paymentMethod.id,
        card_last4: paymentMethod.card?.last4,
        card_brand: paymentMethod.card?.brand,
      }
    } catch (error) {
      logger.error("Error adding payment method:", error)
      throw error
    }
  }

  /**
   * Add a payment method with card details
   */
  async addPaymentMethodWithDetails(
    customerId: string,
    paymentMethodId: string,
    cardDetails: {
      cardholderName: string
      last4: string
      cardType: string
      expiryDate: string
      isDefault: boolean
    },
  ) {
    try {
      // Attach payment method to customer
      await stripeApi.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      })

      // Get payment method details from Stripe
      const paymentMethod = await stripeApi.paymentMethods.retrieve(paymentMethodId)

      // Find customer in our database
      const customer = await CustomerModel.findOneAndUpdate(
        { stripeCustomerId: customerId },
        {
          $addToSet: { paymentMethods: paymentMethodId },
        },
        { new: true },
      )

      if (!customer) {
        throw new Error(`Customer with Stripe ID ${customerId} not found in database`)
      }

      // If this is the default card and the stripe customer exists, update default payment method
      if (cardDetails.isDefault) {
        await stripeApi.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        })
      }

      // Store payment method details in our database
      const paymentMethodData = {
        customerId: customer._id.toString(),
        stripeCustomerId: customerId,
        paymentMethodId: paymentMethodId,
        cardholderName: cardDetails.cardholderName,
        last4: cardDetails.last4,
        cardType: cardDetails.cardType,
        expiryDate: cardDetails.expiryDate,
        isDefault: cardDetails.isDefault,
      }

      // Check if payment method already exists in our database
      const existingPaymentMethod = await PaymentMethodModel.findOne({ paymentMethodId })

      if (existingPaymentMethod) {
        // Update existing payment method
        Object.assign(existingPaymentMethod, paymentMethodData, { updatedAt: new Date() })
        await existingPaymentMethod.save()
      } else {
        // Create new payment method record
        await PaymentMethodModel.create(paymentMethodData)
      }

      // If this is set as default, update any other payment methods to not be default
      if (cardDetails.isDefault) {
        await PaymentMethodModel.updateMany(
          {
            stripeCustomerId: customerId,
            paymentMethodId: { $ne: paymentMethodId },
          },
          {
            isDefault: false,
            updatedAt: new Date(),
          },
        )
      }

      return {
        payment_method_id: paymentMethod.id,
        card_last4: cardDetails.last4 || paymentMethod.card?.last4,
        card_brand: cardDetails.cardType || paymentMethod.card?.brand,
        cardholder_name: cardDetails.cardholderName,
        expiry_date: cardDetails.expiryDate,
        is_default: cardDetails.isDefault,
      }
    } catch (error) {
      logger.error("Error adding payment method with details:", error)
      throw error
    }
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(customerId: string, paymentMethodId: string) {
    try {
      // Check if payment method exists in our database
      const paymentMethod = await PaymentMethodModel.findOne({
        stripeCustomerId: customerId,
        paymentMethodId: paymentMethodId,
      })

      // Check if this was the default payment method
      const wasDefault = paymentMethod?.isDefault || false

      // Delete from Stripe - detach the payment method
      await stripeApi.paymentMethods.detach(paymentMethodId)

      // Remove from customer's payment methods array
      await CustomerModel.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { $pull: { paymentMethods: paymentMethodId } },
      )

      // Delete from our database
      if (paymentMethod) {
        await PaymentMethodModel.deleteOne({ paymentMethodId })
      }

      // If this was the default payment method, we need to set a new default if available
      if (wasDefault) {
        // Find another payment method to set as default
        const anotherPaymentMethod = await PaymentMethodModel.findOne({
          stripeCustomerId: customerId,
          paymentMethodId: { $ne: paymentMethodId },
        })

        if (anotherPaymentMethod) {
          // Set as default in our database
          anotherPaymentMethod.isDefault = true
          anotherPaymentMethod.updatedAt = new Date()
          await anotherPaymentMethod.save()

          // Set as default in Stripe
          await stripeApi.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: anotherPaymentMethod.paymentMethodId,
            },
          })
        }
      }

      return {
        success: true,
        message: "Payment method deleted successfully",
      }
    } catch (error) {
      logger.error("Error deleting payment method:", error)
      throw error
    }
  }

  /**
   * Create a payment intent and charge the customer
   */
  async createPaymentIntent(
    amount: number,
    customerId: string,
    paymentMethodId: string,
    orderId: string,
    currency = "usd",
    returnUrl?: string,
    authToken?: string,
  ) {
    try {
      // Ensure amount is an integer (in cents)
      // If amount looks like a decimal dollar amount (e.g., 65.22), convert it to cents (6522)
      if (!Number.isInteger(amount) && amount < 1000) {
        // If amount has decimal points and is relatively small, it's likely in dollars
        amount = Math.round(amount * 100)
        logger.info(`Converting decimal amount to cents: ${amount}`)
      }

      // Final validation to ensure we have an integer
      if (!Number.isInteger(amount)) {
        amount = Math.round(amount)
        logger.info(`Rounding amount to ensure integer: ${amount}`)
      }

      // Create payment intent with automatic payment methods and no redirects
      const paymentIntentOptions: Record<string, any> = {
        amount, // Amount in cents
        currency,
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true, // Automatically confirm and attempt to charge
        description: `Payment for order ${orderId}`,
        metadata: {
          order_id: orderId,
          integration_check: "accept_a_payment",
        },
        // Explicitly disable redirect-based payment methods
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      }

      // If returnUrl is provided, use it (but we'll still disable redirects as requested)
      if (returnUrl) {
        paymentIntentOptions.return_url = returnUrl
        logger.info(`Return URL provided but redirects are disabled: ${returnUrl}`)
      }

      logger.info(
        `Creating payment intent with options: ${JSON.stringify({
          amount,
          currency,
          customer: customerId,
          payment_method: paymentMethodId,
          automatic_payment_methods: paymentIntentOptions.automatic_payment_methods,
        })}`,
      )

      const paymentIntent = await stripeApi.paymentIntents.create(paymentIntentOptions)

      // Save payment details to database
      await PaymentModel.create({
        orderId,
        amount,
        currency,
        customerId,
        paymentMethodId,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        createdAt: new Date(),
      })

      // If payment is successful, update the order status
      if (paymentIntent.status === "succeeded" && authToken) {
        try {
          logger.info(`Payment successful for order ${orderId}, updating order status`)
          await updateOrderStatus(orderId, authToken)
        } catch (error) {
          // Log the error but don't fail the payment process
          logger.error(`Failed to update order status for order ${orderId}: ${error}`)
        }
      }

      return {
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }
    } catch (error) {
      logger.error("Payment failed:", error)
      throw error
    }
  }

  /**
   * Process a refund for a specific payment intent
   */
  async refundPayment(paymentIntentId: string, amount?: number, reason?: string) {
    try {
      // Retrieve the original payment intent to verify details
      const paymentIntent = await stripeApi.paymentIntents.retrieve(paymentIntentId)

      // Prepare refund parameters
      const refundParams: Record<string, any> = {
        payment_intent: paymentIntentId,
      }

      // Add amount if specified (partial refund)
      if (amount) {
        refundParams.amount = amount
      }

      // Process the refund
      const refund = await stripeApi.refunds.create(refundParams)

      // Update payment record in database
      const payment = await PaymentModel.findOne({ paymentIntentId })
      if (payment) {
        payment.refunded = true
        payment.refundAmount = amount || payment.amount
        payment.refundId = refund.id
        payment.updatedAt = new Date()
        await payment.save()
      }

      return {
        refund_id: refund.id,
        status: refund.status,
        amount: refund.amount,
        currency: refund.currency,
        payment_intent: refund.payment_intent,
      }
    } catch (error) {
      logger.error("Refund failed:", error)
      throw error
    }
  }
}

export default new StripePaymentProcessor()

