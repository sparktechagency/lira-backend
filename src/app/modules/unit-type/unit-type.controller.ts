import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { UnitTypeService } from './unit-type.service';

//unit type
const createUnitType = catchAsync(async (req, res) => {
     const { ...unitTypeData } = req.body;
     const result = await UnitTypeService.createUnitTypeToDB(unitTypeData);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Unit type created successfully',
          data: result,
     });
});

const getUnitType = catchAsync(async (req, res) => {
     const { type } = req.query as { type: 'type' | 'unit' };
     const result = await UnitTypeService.getUnitTypeFromDB(type);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: `${type} retrieved successfully`,
          data: result,
     });
});



export const UnitTypeController = {
     createUnitType,
     getUnitType,
};
