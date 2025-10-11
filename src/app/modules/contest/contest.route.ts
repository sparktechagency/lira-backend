import express from 'express';
import { ContestController } from './contest.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';

const router = express.Router();

// Admin routes
router.post(
    '/create',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    fileUploadHandler(),
    parseFileData(FOLDER_NAMES.IMAGE),
    ContestController.createContest
);

router.get(
    '/',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ContestController.getAllContests
);

router.get(
    '/category/:id',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ContestController.getContestByCategoryId
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
router.get('/active/list', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getActiveContests);
router.get('/contest/news', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getContestNews);
router.get('/contest/price-history', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getCryptoPriceHistory);
router.get('/stock/history', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getStockPriceHistory);
router.get('/economic/data', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getEconomicData);



router.get('/contest/:id', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getContestByIdUser);
router.get('/:id/tiers', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getTiersContest);
router.get('/contest/prediction/:contestId/tiers/:tierId', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getPredictionTiers);

export const ContestRoutes = router;