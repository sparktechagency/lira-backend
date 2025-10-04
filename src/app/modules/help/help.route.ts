import express from 'express';
import { HelpController } from './help.controller'
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();
router.post('/create', auth(USER_ROLES.USER), HelpController.createHelp);
