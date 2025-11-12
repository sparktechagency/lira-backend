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
router.post(
    '/shuffle-serial',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ContestController.shuffleContestSerial
);
router.get(
    '/',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ContestController.getAllContests
);
router.patch(
    '/:id/update-status',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ContestController.updateStatus
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
router.post(
    '/:id/copy',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ContestController.copyContest
);



// Public routes (for users)
router.get('/active/list', ContestController.getActiveContests);
router.get('/contest/news', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getContestNews);
router.get('/crypto/price-history', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getCryptoPriceHistory);
router.get('/stock/history', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getStockPriceHistory);
router.get('/economic/data', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getEconomicData);
router.get('/sports/data', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getSportsData);
router.get('/entertainment/data', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getEntertainmentData);
router.get('/energy/data', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getEnergyData);
router.get('/unified/forecast', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getUnifiedForecastData);


// Energy data route

router.get('/contest/:id', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getContestByIdUser);
router.get('/contest/admin/:id', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getContestByIdByAdmin);
router.get('/:id/tiers', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getTiersContest);
router.get('/contest/prediction/:contestId/tiers/:tierId', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ContestController.getPredictionTiers);

export const ContestRoutes = router;