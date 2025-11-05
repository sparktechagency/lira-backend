import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse";
import { WaitListService } from "./waitList.service";

const createWaitList = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    req.body.userId = id;
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

const getSingleWaitList = catchAsync(async (req, res) => {
    const result = await WaitListService.getSingleWaitList(req.params.id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'WaitList fetched successfully',
        data: result,
    });
})

const deleteWaitList = catchAsync(async (req, res) => {
    const result = await WaitListService.deleteWaitList(req.params.id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'WaitList deleted successfully',
        data: result,
    });
})

export const WaitListController = {
    createWaitList,
    getAllWaitList,
    getSingleWaitList,
    deleteWaitList,
}
