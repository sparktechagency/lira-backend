import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { ManuallyWinnerContestController } from './manuallyWinnerContest.controller';
const router = express.Router();

router.get(
    '/pending',
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), // Adjust based on your auth middleware
    ManuallyWinnerContestController.getPendingContests
);
router.post(
    '/:contestId/determine-winners',
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    ManuallyWinnerContestController.determineContestWinners
);
router.get(
    '/:contestId/results',
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), // Adjust based on your auth middleware
    ManuallyWinnerContestController.getContestResults
);
router.delete(
    '/:contestId/reset-results',
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    ManuallyWinnerContestController.resetContestResults
);
router.get(
    '/:contestId/orders',
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    ManuallyWinnerContestController.getContestOrdersDetails
);

export const ManuallyWinnerContestRoutes = router;