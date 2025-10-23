import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { WithdrawalController } from './withdrawal.controller';
import { WithdrawalValidation } from './withdrawal.validation';


const router = express.Router();

// ==================== USER ROUTES ====================

// 💳 Card Management
router.post(
     '/cards/add',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN),
     validateRequest(WithdrawalValidation.addCardSchema),
     WithdrawalController.addCardForWithdrawal,
);

router.get(
     '/cards',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN),
     WithdrawalController.getUserCards,
);

router.delete(
     '/cards/:cardId',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN),
     WithdrawalController.removeCard,
);

// 💰 Withdrawal Requests
router.post(
     '/request',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN),
     validateRequest(WithdrawalValidation.requestWithdrawalSchema),
     WithdrawalController.requestWithdrawal,
);

router.get(
     '/my-withdrawals',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN),
     WithdrawalController.getUserWithdrawals,
);

router.get(
     '/details/:withdrawalId',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN),
     WithdrawalController.getWithdrawalDetails,
);

router.patch(
     '/cancel/:withdrawalId',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN),
     WithdrawalController.cancelWithdrawal,
);

// 💼 Wallet Info
router.get(
     '/wallet',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN),
     WithdrawalController.getUserWallet,
);

// ==================== ADMIN ROUTES ====================

// 📋 Withdrawal Management
router.get(
     '/admin/all',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     WithdrawalController.getAllWithdrawals,
);

router.get(
     '/admin/:withdrawalId',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     WithdrawalController.getWithdrawalById,
);

router.patch(
     '/admin/approve/:withdrawalId',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     validateRequest(WithdrawalValidation.approveWithdrawalSchema),
     WithdrawalController.approveWithdrawal,
);

router.patch(
     '/admin/reject/:withdrawalId',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     validateRequest(WithdrawalValidation.rejectWithdrawalSchema),
     WithdrawalController.rejectWithdrawal,
);

// 📊 Statistics
router.get(
     '/admin/stats',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     WithdrawalController.getWithdrawalStats,
);

// 🔄 Retry Failed
router.post(
     '/admin/retry/:withdrawalId',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     WithdrawalController.retryFailedWithdrawal,
);

// 🔍 Check Payout Status
router.get(
     '/admin/check-status/:withdrawalId',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     WithdrawalController.checkPayoutStatus,
);

export const WithdrawalRoutes = router;