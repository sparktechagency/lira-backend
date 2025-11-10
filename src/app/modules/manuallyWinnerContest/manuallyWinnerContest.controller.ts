import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse";
import { ManuallyWinnerService } from "./manuallyWinnerContest.service";

const determineContestWinners = catchAsync(async (req, res) => {
    const { contestId } = req.params;
    const { actualValue } = req.body;

    // Get admin ID from authenticated user
    const { id: adminId } = req.user as { id: string };

    if (!adminId) {
        return sendResponse(res, {
            success: false,
            statusCode: StatusCodes.UNAUTHORIZED,
            message: 'Admin authentication required',
            data: null
        });
    }

    const result = await ManuallyWinnerService.determineContestWinners(
        contestId,
        actualValue,
        adminId
    );

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest winners determined manually by admin',
        data: result
    });
});

const getContestResults = catchAsync(async (req, res) => {
    const { contestId } = req.params;
    const result = await ManuallyWinnerService.getContestResults(contestId);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest results retrieved successfully',
        data: result
    });
});

const getPendingContests = catchAsync(async (req, res) => {
    const result = await ManuallyWinnerService.getPendingContests(req.query);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Pending contests retrieved successfully',
        data: result
    });
});

const resetContestResults = catchAsync(async (req, res) => {
    const { contestId } = req.params;
    const confirmReset = true;

    const result = await ManuallyWinnerService.resetContestResults(
        contestId,
        confirmReset
    );

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest results reset successfully',
        data: result
    });
});

const getContestOrdersDetails = catchAsync(async (req, res) => {
    const { contestId } = req.params;
    const result = await ManuallyWinnerService.getContestOrdersDetails(contestId);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest orders details retrieved successfully',
        data: result
    });
});

export const ManuallyWinnerContestController = {
    determineContestWinners,
    getContestResults,
    getPendingContests,
    resetContestResults,
    getContestOrdersDetails
};