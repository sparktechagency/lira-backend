import { StatusCodes } from "http-status-codes"
import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse"
import { ContestService } from "./contest.service";

const createContest = catchAsync(async (req, res) => {
    const result = await ContestService.createContest(req.body);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.CREATED,
        message: 'Contest created successfully',
        data: result
    })
})

export const ContestController = { createContest }