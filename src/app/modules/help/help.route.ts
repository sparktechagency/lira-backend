import express from 'express';
import { HelpController } from './help.controller'
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();
router.post('/create', auth(USER_ROLES.USER), HelpController.createHelp);
router.get('/', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), HelpController.getAllHelps);
router.patch("/resolved/:id", auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), HelpController.updateHelpResolvedStatus)
router.delete("/delete/:id", auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), HelpController.deleteHelp)
router.get('/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), HelpController.getSingleHelp);



export const HelpRouter = router;
