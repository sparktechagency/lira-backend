import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { RuleService } from './unit-type.service';

//unit type
const createUnitType = catchAsync(async (req, res) => {
     const { ...unitTypeData } = req.body;
     const result = await RuleService.createUnitTypeToDB(unitTypeData);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Unit type created successfully',
          data: result,
     });
});

const getUnitType = catchAsync(async (req, res) => {
     const { type } = req.params as { type: 'type' | 'unit' };
     const result = await RuleService.getUnitTypeFromDB(type);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: `${type} retrieved successfully`,
          data: result,
     });
});



export const RuleController = {
     createUnitType,
     getUnitType,
};
