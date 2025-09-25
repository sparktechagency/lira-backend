import express from 'express';
import { ContestController } from './contest.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';
import validateRequest from '../../middleware/validateRequest';
import { ContestValidation } from './contest.validation';

const router = express.Router();

// Admin routes
router.post(
    '/create',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    fileUploadHandler(),
    parseFileData(FOLDER_NAMES.IMAGE),
    validateRequest(ContestValidation.contestSchema),
    ContestController.createContest
);

router.get(
    '/',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ContestController.getAllContests
);

router.get(
    '/:id',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ContestController.getContestById
);

router.patch(
    '/:id',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    fileUploadHandler(),
    parseFileData(FOLDER_NAMES.IMAGE),
    ContestController.updateContest
);

router.delete(
    '/:id',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ContestController.deleteContest
);

router.post(
    '/:id/generate-predictions',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ContestController.generatePredictions
);

router.patch(
    '/:id/publish',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ContestController.publishContest
);

// Public routes (for users)
router.get('/active/list', ContestController.getActiveContests);
router.get('/upcoming/list', ContestController.getUpcomingContests);

export const ContestRoutes = router;