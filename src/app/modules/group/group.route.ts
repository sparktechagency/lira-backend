import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { GroupController } from './group.controller';
import { GroupValidation } from './group.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
const router = express.Router();

router.post('/create', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), validateRequest(GroupValidation.createGroupZodSchema), GroupController.createGroup);
router.post('/shuffle-group-serial', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), GroupController.shuffleGroupSerial);
router
     .route('/:id')
     .patch(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), GroupController.updateGroup)
     .delete(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), GroupController.deleteGroup);

router.get('/', GroupController.getGroups);

export const GroupRoutes = router;
