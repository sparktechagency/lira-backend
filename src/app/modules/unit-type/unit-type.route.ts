import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { UnitTypeController } from './unit-type.controller';
import auth from '../../middleware/auth';
const router = express.Router();

//unit type
router.post('/create', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UnitTypeController.createUnitType)
router.get('/', UnitTypeController.getUnitType);


export const UnitTypeRoute = router;