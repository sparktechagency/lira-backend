import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { RuleController } from './unit-type.controller';
import auth from '../../middleware/auth';
const router = express.Router();

//unit type
router.route('/:type').post(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), RuleController.createUnitType).get(RuleController.getUnitType);

export const UnitTypeRoute = router;