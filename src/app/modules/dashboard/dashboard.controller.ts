import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse";
import { DashboardService } from "./dashboard.service"

const getAnalytics = catchAsync(async (req, res) => {
    const result = await DashboardService.getAnalytics();

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Dashboard analytics retrieved successfully',
        data: result,
    });
})
export const DashboardController = {
    getAnalytics
}
