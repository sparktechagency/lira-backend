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
export const ManuallyWinnerContestController = {}
