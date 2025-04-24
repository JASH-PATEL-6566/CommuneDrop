import { Router, type Request, type Response, type NextFunction } from "express"
import paymentController from "../controllers/payment.controller"

// Create router instance
const router = Router()

/**
 * @swagger
 * /customer/{email}:
 *   get:
 *     summary: Get a customer by email
 *     description: Retrieves a customer by their email address
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer's email address
 *     responses:
 *       200:
 *         description: Customer found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     customerId:
 *                       type: string
 *                       example: cus_123456789
 *       404:
 *         description: Customer not found
 *       400:
 *         description: Bad request
 */
router.get("/customer/:email", (req: Request, res: Response, next: NextFunction) =>
  paymentController.getCustomer(req, res, next),
)

/**
 * @swagger
 * /customer:
 *   post:
 *     summary: Create a new customer
 *     description: Creates a new customer in Stripe and the database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: customer@example.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     customerId:
 *                       type: string
 *                       example: cus_123456789
 *       400:
 *         description: Bad request
 */
router.post("/customer", (req: Request, res: Response, next: NextFunction) =>
  paymentController.createCustomer(req, res, next),
)

/**
 * @swagger
 * /payment-method:
 *   post:
 *     summary: Add a new payment method
 *     description: Adds a new payment method to a customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - paymentMethodId
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: cus_123456789
 *               paymentMethodId:
 *                 type: string
 *                 example: pm_123456789
 *     responses:
 *       200:
 *         description: Payment method added successfully
 *       400:
 *         description: Bad request
 */
router.post("/payment-method", (req: Request, res: Response, next: NextFunction) =>
  paymentController.addPaymentMethod(req, res, next),
)

/**
 * @swagger
 * /payment-method-details:
 *   post:
 *     summary: Add a payment method with details
 *     description: Adds a payment method with card details to a customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - paymentMethodId
 *               - cardholderName
 *               - last4
 *               - cardType
 *               - expiryDate
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: cus_123456789
 *               paymentMethodId:
 *                 type: string
 *                 example: pm_123456789
 *               cardholderName:
 *                 type: string
 *                 example: John Doe
 *               last4:
 *                 type: string
 *                 example: 4242
 *               cardType:
 *                 type: string
 *                 example: visa
 *               expiryDate:
 *                 type: string
 *                 example: 12/25
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Payment method added successfully
 *       400:
 *         description: Bad request
 */
router.post("/payment-method-details", (req: Request, res: Response, next: NextFunction) =>
  paymentController.addPaymentMethodWithDetails(req, res, next),
)

/**
 * @swagger
 * /payment-method:
 *   delete:
 *     summary: Delete a payment method
 *     description: Deletes a payment method from a customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - paymentMethodId
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: cus_123456789
 *               paymentMethodId:
 *                 type: string
 *                 example: pm_123456789
 *     responses:
 *       200:
 *         description: Payment method deleted successfully
 *       400:
 *         description: Bad request
 */
router.delete("/payment-method", (req: Request, res: Response, next: NextFunction) =>
  paymentController.deletePaymentMethod(req, res, next),
)

/**
 * @swagger
 * /payment-methods/{customerId}:
 *   get:
 *     summary: List payment methods
 *     description: Lists all payment methods for a customer
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer's Stripe ID
 *     responses:
 *       200:
 *         description: List of payment methods
 *       400:
 *         description: Bad request
 */
router.get("/payment-methods/:customerId", (req: Request, res: Response, next: NextFunction) =>
  paymentController.listPaymentMethods(req, res, next),
)

/**
 * @swagger
 * /payment-intent:
 *   post:
 *     summary: Create a payment intent
 *     description: Creates a payment intent and charges the customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - customerId
 *               - paymentMethodId
 *               - orderId
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 2000
 *               customerId:
 *                 type: string
 *                 example: cus_123456789
 *               paymentMethodId:
 *                 type: string
 *                 example: pm_123456789
 *               orderId:
 *                 type: string
 *                 example: order_123456789
 *               currency:
 *                 type: string
 *                 example: usd
 *               returnUrl:
 *                 type: string
 *                 example: https://example.com/return
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *       400:
 *         description: Bad request
 */
router.post("/payment-intent", (req: Request, res: Response, next: NextFunction) =>
  paymentController.createPaymentIntent(req, res, next),
)

/**
 * @swagger
 * /refund:
 *   post:
 *     summary: Refund a payment
 *     description: Processes a refund for a specific payment intent
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 example: pi_123456789
 *               amount:
 *                 type: number
 *                 example: 1000
 *               reason:
 *                 type: string
 *                 example: customer_requested
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Bad request
 */
router.post("/refund", (req: Request, res: Response, next: NextFunction) =>
  paymentController.refundPayment(req, res, next),
)

export default router

