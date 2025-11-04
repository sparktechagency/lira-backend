import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { WaitListController } from './waitList.controller';



const router = express.Router();

router.post('/create',auth(USER_ROLES.USER), WaitListController.createWaitList);

export const WaitListRoutes = router;