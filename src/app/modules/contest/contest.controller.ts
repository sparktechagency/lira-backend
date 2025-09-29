import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ContestService } from "./contest.service";

const createContest = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const payload = {
        ...req.body,
        createdBy: id
    };
    const result = await ContestService.createContest(payload);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.CREATED,
        message: 'Contest created successfully',
        data: result
    });
});

const getAllContests = catchAsync(async (req, res) => {
    const result = await ContestService.getAllContests(req.query);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contests retrieved successfully',
        data: result.result,
        meta: result.meta
    });
});

const getContestById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ContestService.getContestById(id);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest retrieved successfully',
        data: result
    });
});

const updateContest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ContestService.updateContest(id, req.body);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest updated successfully',
        data: result
    });
});

const deleteContest = catchAsync(async (req, res) => {
    const { id } = req.params;
    await ContestService.deleteContest(id);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest deleted successfully',
        data: null
    });
});

const generatePredictions = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ContestService.generateContestPredictions(id);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Predictions generated successfully',
        data: result
    });
});

const getActiveContests = catchAsync(async (req, res) => {
    const result = await ContestService.getActiveContests(req.query);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Active contests retrieved successfully',
        data: result.result,
        meta: result.meta
    });
});

const getPredictionTiers = catchAsync(async (req, res) => {
  const { contestId, tierId } = req.params;
    const result = await ContestService.getPredictionTiers(contestId, tierId);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Upcoming contests retrieved successfully',
        data: result
    });
});

const publishContest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ContestService.publishContest(id);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest published successfully',
        data: result
    });
});

const getTiersContest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ContestService.getTiersContest(id);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest tiers retrieved successfully',
        data: result
    });
});

export const ContestController = {
    createContest,
    getAllContests,
    getContestById,
    updateContest,
    deleteContest,
    generatePredictions,
    getActiveContests,
    getPredictionTiers,
    publishContest,
    getTiersContest
};