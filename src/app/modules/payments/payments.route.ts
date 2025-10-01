import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { PaymentController } from './payments.controller';
import { PaymentValidation } from './payments.validation';

const router = express.Router();

// Create a new payment
router.post('/create', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), validateRequest(PaymentValidation.createPaymentZodSchema), PaymentController.createPayment);

// Get all payments
router.get('/get-all', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), PaymentController.getAllPayments);

// Get a single payment
router.get('/get-single/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), PaymentController.getSinglePayment);

// Update a payment
router.patch('/update/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), validateRequest(PaymentValidation.updatePaymentZodSchema), PaymentController.updatePayment);

// Delete a payment
router.delete('/delete/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), PaymentController.deletePayment);

export const PaymentRoutes = router;
