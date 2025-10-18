import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { ManuallyWinnerContestController } from './manuallyWinnerContest.controller';
const router = express.Router();

router.post(
    '/:contestId/determine-winners',
    auth(USER_ROLES.SUPER_ADMIN),
    ManuallyWinnerContestController.determineContestWinners
);

export const ManuallyWinnerContestRoutes = router;