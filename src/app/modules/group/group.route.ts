import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { GroupController } from './group.controller';
import { GroupValidation } from './group.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';
const router = express.Router();

router.post('/create-group', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), fileUploadHandler(), parseFileData(FOLDER_NAMES.IMAGE), validateRequest(GroupValidation.createGroupZodSchema), GroupController.createGroup);
router.post('/shuffle', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), GroupController.shuffleGroupSerial);
router
     .route('/:id')
     .patch(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), fileUploadHandler(), parseFileData(FOLDER_NAMES.IMAGE), GroupController.updateGroup)
     .delete(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), GroupController.deleteGroup);

router.get('/', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER), GroupController.getGroups);

export const GroupRoutes = router;
