import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse";
import { ManuallyWinnerService } from "./manuallyWinnerContest.service";

const determineContestWinners = catchAsync(async (req, res) => {
    const { contestId } = req.params;
    const { actualValue } = req.body;
    const result = await ManuallyWinnerService.determineContestWinners(contestId, actualValue);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest winners determined successfully',
        data: result
    });
})
const getContestResults = catchAsync(async (req, res) => {
    const { contestId } = req.params;
    const result = await ManuallyWinnerService.getContestResults(contestId);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest results retrieved successfully',
        data: result
    });
})
const getPendingContests = catchAsync(async (req, res) => {
    const result = await ManuallyWinnerService.getPendingContests(req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Pending contests retrieved successfully',
        data: result
    });
})
const resetContestResults = catchAsync(async (req, res) => {
    const { contestId } = req.params;
    const { confirmReset } = req.body;
    const result = await ManuallyWinnerService.resetContestResults(contestId, confirmReset);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest results reset successfully',
        data: result
    });
})
export const ManuallyWinnerContestController = { determineContestWinners, getContestResults, getPendingContests, resetContestResults }
