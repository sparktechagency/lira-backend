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
        data: result.data,
        meta: result.meta
    });
});

const getPredictionTiers = catchAsync(async (req, res) => {
    const { contestId, tierId } = req.params;
    const { minValue, maxValue, searchValue } = req.query;
    const minValueNum = minValue ? Number(minValue) : undefined;
    const maxValueNum = maxValue ? Number(maxValue) : undefined;
    const searchValueNum = searchValue ? Number(searchValue) : undefined;

    const result = await ContestService.getPredictionTiers(contestId, tierId, minValueNum, maxValueNum, searchValueNum);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Prediction tiers retrieved successfully',
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
const updateStatus = catchAsync(async (req, res) => {

    const { id } = req.params;
    const { status } = req.body;
    const result = await ContestService.updateStatus(id, status);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest status updated successfully',
        data: result
    });
})
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

const getContestByIdUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { id: userId } = req.user as { id: string };
    const result = await ContestService.getContestByIdUser(id, userId);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest retrieved successfully',
        data: result
    });
});
const getContestByIdByAdmin = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { id: userId } = req.user as { id: string };
    const result = await ContestService.getContestByIdAdmin(id, userId);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest retrieved successfully',
        data: result
    });
});

const getContestByCategoryId = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ContestService.getContestByCategoryId(id);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest retrieved successfully',
        data: result
    });
});

const shuffleContestSerial = catchAsync(async (req, res) => {
    const { contestOrder } = req.body;
    const result = await ContestService.shuffleContestSerial(contestOrder);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest serial shuffled successfully',
        data: result
    });
});



const getContestNews = catchAsync(async (req, res) => {
    const result = await ContestService.getCryptoNews();
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest news retrieved successfully',
        data: result
    });
});

const getCryptoPriceHistory = catchAsync(async (req, res) => {
    const result = await ContestService.getCryptoPriceHistory(req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Contest price history retrieved successfully',
        data: result
    });
});

const getStockPriceHistory = catchAsync(async (req, res) => {
    const result = await ContestService.getStockPriceHistory(req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Stock price history retrieved successfully',
        data: result
    });
});


const getEconomicData = catchAsync(async (req, res) => {
    const result = await ContestService.getEconomicData(req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Economic data retrieved successfully',
        data: result
    });
});


const getSportsData = catchAsync(async (req, res) => {
    const result = await ContestService.getSportsData(req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Sports data retrieved successfully',
        data: result
    });
});

const getEntertainmentData = catchAsync(async (req, res) => {
    const result = await ContestService.getEntertainmentData(req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Entertainment data retrieved successfully',
        data: result
    });
});




const getUnifiedForecastData = catchAsync(async (req, res) => {
    const result = await ContestService.getUnifiedForecastData(req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Unified forecast data retrieved successfully',
        data: result
    });
});

const getEnergyData = catchAsync(async (req, res) => {
    const result = await ContestService.getEnergyData(req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Energy data retrieved successfully',
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
    getTiersContest,
    getContestByIdUser,
    getContestByCategoryId,
    getContestNews,
    getCryptoPriceHistory,
    getStockPriceHistory,
    getEconomicData,
    getSportsData,
    getEntertainmentData,
    getUnifiedForecastData,
    getEnergyData,
    shuffleContestSerial,
    getContestByIdByAdmin,
    updateStatus
};