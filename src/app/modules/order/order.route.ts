import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { OrderController } from './order.controller';
import { ProductOrderValidation } from './order.validation';

const router = express.Router();

// Create order and checkout in one step
router.post('/create-and-checkout', auth(USER_ROLES.USER),  OrderController.createOrderAndCheckout);

// // Get all orders (admin only)
router.get('/get-all', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), OrderController.getAllPredictionOrders);
router.get('/single-order/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), OrderController.getSinglePredictionOrder);
// // Get all orders (admin only)
// router.get('/get-order-revenue', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), OrderController.getAllProductOrders);
// // Get user's orders
router.get('/my-orders', auth(USER_ROLES.USER), OrderController.getUserOrders);

// Get a single order

// Update an order (admin only)
router.patch('/update/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), validateRequest(ProductOrderValidation.updateProductOrderZodSchema), OrderController.updateProductOrder);
// router.get('/analysis', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), OrderController.analysisOrders);
// Delete an order (admin only)
// router.delete('/cancel/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ProductOrderController.cancelProductOrder);
// Handle successful payment
router.get('/success', OrderController.orderSuccess);
router.get('/cancel', OrderController.orderCancel);
export const OrderRoutes = router;
