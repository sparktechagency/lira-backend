import { StatusCodes } from "http-status-codes";
import sendResponse from "../../../shared/sendResponse";
import { DashboardService } from "./dashboard.service";
import catchAsync from "../../../shared/catchAsync";

const getAnalytics = catchAsync(async (req, res) => {
    const filters = {
        dateRange: req.query.dateRange as string,
        category: req.query.category as string,
        gameType: req.query.gameType as string,
        userSegment: req.query.userSegment as string,
        product: req.query.product as string,
        region: req.query.region as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
    };

    const result = await DashboardService.getAnalytics(filters);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Dashboard analytics retrieved successfully',
        data: result,
    });
});

export const DashboardController = {
    getAnalytics,
};