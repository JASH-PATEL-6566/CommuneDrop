import express from "express";
import {
  createOrderController,
  cancleOrderController,
  orderPaymentController,
  fetchAllOrdersOfUserController,
  fetchAllOrdersOfRiderController,
  orderUpdateStatusController,
} from "../controllers/order.controller";
import {
  validateOrderCreationRequest,
  validateOrderCancellationRequest,
  validateOrderPaymentRequest,
  validateFetchOrdersOfUserRequest,
  validateFetchOrdersOfRiderRequest,
  validateOrderUpdateRequest,
} from "../middlewares/validateReq.middleware";
import { AuthMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * /order/create:
 *   post:
 *     summary: Create a new order
 *     description: Creates a new delivery order with pricing details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/create",
  AuthMiddleware,
  validateOrderCreationRequest,
  createOrderController
);

/**
 * @swagger
 * /order/cancle/{order_id}:
 *   post:
 *     summary: Cancel an order
 *     description: Cancels an existing order and processes refund if payment was made
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to cancel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refundId]
 *             properties:
 *               refundId:
 *                 type: string
 *                 example: "ref_123456789"
 *     responses:
 *       200:
 *         description: Order canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/cancle/:order_id",
  AuthMiddleware,
  validateOrderCancellationRequest,
  cancleOrderController
);

/**
 * @swagger
 * /order/payment:
 *   post:
 *     summary: Process order payment
 *     description: Updates an order with payment information and changes status to PAYMENT RECEIVED
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderPaymentRequest'
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         orderId:
 *                           type: string
 *                         from_address:
 *                           type: string
 *                         to_address:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         status:
 *                           type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/payment",
  AuthMiddleware,
  validateOrderPaymentRequest,
  orderPaymentController
);

/**
 * @swagger
 * /order/getAllOrders/user/{user_id}:
 *   get:
 *     summary: Get all orders for a user
 *     description: Retrieves all orders associated with a specific user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/getAllOrders/user/:user_id",
  AuthMiddleware,
  validateFetchOrdersOfUserRequest,
  fetchAllOrdersOfUserController
);

/**
 * @swagger
 * /order/getAllOrders/rider/{rider_id}:
 *   get:
 *     summary: Get all orders for a rider
 *     description: Retrieves all orders associated with a specific rider
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rider_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the rider
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/getAllOrders/rider/:rider_id",
  AuthMiddleware,
  validateFetchOrdersOfRiderRequest,
  fetchAllOrdersOfRiderController 
);

/**
 * @swagger
 * /order/updateStatus:
 *   put:
 *     summary: Update order status
 *     description: Updates the status of an existing order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderUpdateStatusRequest'
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  "/updateStatus",
  AuthMiddleware,
  validateOrderUpdateRequest,
  orderUpdateStatusController
);

/**
 * @swagger
 * /order/refund:
 *   post:
 *     summary: Process order refund
 *     description: Processes a refund for an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderRefundRequest'
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/refund",
  AuthMiddleware,
  validateOrderPaymentRequest,
  orderPaymentController
);

export default router;
