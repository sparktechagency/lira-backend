import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { GroupService } from './group.service';


const createGroup = catchAsync(async (req, res) => {
     const result = await GroupService.createGroupToDB(req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Category create successfully',
          data: result,
     });
});

const getGroups = catchAsync(async (req, res) => {
     const result = await GroupService.getGroupsFromDB();

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Group retrieved successfully',
          data: result,
     });
});

const updateGroup = catchAsync(async (req, res) => {
     const id = req.params.id;
     const result = await GroupService.updateGroupToDB(id, req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Group updated successfully',
          data: result,
     });
});

const deleteGroup = catchAsync(async (req, res) => {
     const id = req.params.id;
     const result = await GroupService.deleteGroupToDB(id);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Group delete successfully',
          data: result,
     });
});
const shuffleGroupSerial = catchAsync(async (req, res) => {
     const result = await GroupService.shuffleGroupSerial(req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Group serial shuffled successfully',
          data: result,
     });
});
export const GroupController = {
     createGroup,
     getGroups,
     updateGroup,
     deleteGroup,
     shuffleGroupSerial,
};
