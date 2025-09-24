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
          statusCode: StatusCodes.CREATED,
          message: 'Unit type created successfully',
          data: result,
     });
});

const getUnitType = catchAsync(async (req, res) => {
     const { key } = req.query as { key: 'type' | 'unit' };
     const result = await UnitTypeService.getUnitTypeFromDB(key);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: `${key} retrieved successfully`,
          data: result,
     });
});

const updateUnitType = catchAsync(async (req, res) => {
     const { id } = req.params;
     const { ...unitTypeData } = req.body;
     const result = await UnitTypeService.updateUnitTypeToDB(id, unitTypeData);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Unit type updated successfully',
          data: result,
     });
});
const deleteUnitType = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await UnitTypeService.deleteUnitTypeFromDB(id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Unit type deleted successfully',
          data: result,
     });
});


export const UnitTypeController = {
     createUnitType,
     getUnitType,
     updateUnitType,
     deleteUnitType,
};
