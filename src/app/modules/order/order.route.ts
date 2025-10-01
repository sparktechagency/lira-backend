import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { ProductOrderController } from './order.controller';
import { ProductOrderValidation } from './order.validation';

const router = express.Router();

// Create order and checkout in one step
router.post('/create-and-checkout', auth(USER_ROLES.USER), validateRequest(ProductOrderValidation.createProductOrderZodSchema), ProductOrderController.createOrderAndCheckout);

// Get all orders (admin only)
router.get('/get-all', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ProductOrderController.getAllProductOrders);
// Get all orders (admin only)
router.get('/get-order-revenue', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ProductOrderController.getAllProductOrders);
// Get user's orders
router.get('/my-orders', auth(USER_ROLES.USER), ProductOrderController.getUserOrders);

// Get a single order
router.get('/get-single/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ProductOrderController.getSingleProductOrder);

// Update an order (admin only)
router.patch('/update/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), validateRequest(ProductOrderValidation.updateProductOrderZodSchema), ProductOrderController.updateProductOrder);
router.get('/analysis', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ProductOrderController.analysisOrders);
// Delete an order (admin only)
// router.delete('/cancel/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ProductOrderController.cancelProductOrder);

// Handle successful payment
router.get('/success', ProductOrderController.orderSuccess);

export const ProductOrderRoutes = router;
