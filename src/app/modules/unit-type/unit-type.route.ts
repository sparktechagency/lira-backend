import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { UnitTypeController } from './unit-type.controller';
import auth from '../../middleware/auth';
const router = express.Router();

//unit type
router.post('/create', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UnitTypeController.createUnitType)
router.get('/', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UnitTypeController.getUnitType);
router.put('/update/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UnitTypeController.updateUnitType);
router.delete('/delete/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UnitTypeController.deleteUnitType);



export const UnitTypeRoute = router;