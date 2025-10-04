import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { HelpService } from "./help.service";

const createHelp = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await HelpService.createHelp({
        userId: id,
        ...req.body,
    });
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.CREATED,
        message: 'Help created successfully',
        data: result,
    });
});
const getAllHelps = catchAsync(async (req, res) => {
    const result = await HelpService.getAllHelpsDataFromDb(req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Help retrieved successfully',
        data: result,
    });
});
const getSingleHelp = catchAsync(async (req, res) => {
    const result = await HelpService.getSingleHelpFromDb(req.params.id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Help retrieved successfully',
        data: result,
    });
});
const updateHelpResolvedStatus = catchAsync(async (req, res) => {
    const result = await HelpService.updateHelpResolvedStatus(req.params.id, req.body);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Help resolved status updated successfully',
        data: result,
    });
});
const deleteHelp = catchAsync(async (req, res) => {
    const result = await HelpService.deleteHelp(req.params.id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Help deleted successfully',
        data: result,
    });
});
export const HelpController = {
    createHelp,
    getAllHelps,
    getSingleHelp,
    updateHelpResolvedStatus,
    deleteHelp,

    //   getHelp,
};
