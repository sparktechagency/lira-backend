import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse";
import { WaitListService } from "./waitList.service";

const createWaitList = catchAsync(async (req, res) => {
    const result = await WaitListService.createWaitList(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'WaitList created successfully',
        data: result,
    });
})

const getAllWaitList = catchAsync(async (req, res) => {
    const result = await WaitListService.getAllWaitList();
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'WaitList fetched successfully',
        data: result,
    });
})

export const WaitListController = {
    createWaitList,
    getAllWaitList,
}
