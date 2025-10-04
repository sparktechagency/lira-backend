import express from 'express';
import auth from '../../middleware/auth';
import { ReferralController } from './referral.controller';

const router = express.Router();

// Get user's referral code
router.get(
  '/code',
  auth(),
  ReferralController.getReferralCode
);

// Accept a referral invitation
router.post(
  '/accept',
  auth(),
  ReferralController.acceptReferral
);

// Get referral statistics
router.get(
  '/stats',
  auth(),
  ReferralController.getReferralStats
);

export const ReferralRoutes = router;