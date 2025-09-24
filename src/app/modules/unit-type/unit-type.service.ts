import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { UnitType } from './unit-type.model';
import { IUnitType } from './unit-type.interface';

//unit type
const createUnitTypeToDB = async (payload: IUnitType) => {
     // check if unit type exist or not
     const isExistUnitType = await UnitType.findOne({ content: payload.content, type: payload.type });
     if (isExistUnitType) {
          throw new AppError(StatusCodes.BAD_REQUEST, `${payload.type} and ${payload.content} already exist!`);
     }
     const result = await UnitType.create(payload);
     return result;
};
const getUnitTypeFromDB = async (key: 'type' | 'unit') => {
     const result = await UnitType.find({ type: key });
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, `Unit type ${key} doesn't exist!`);
     }
     return result;
};

export const UnitTypeService = {
     createUnitTypeToDB,
     getUnitTypeFromDB,
};
