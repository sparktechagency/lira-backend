import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { IContest } from "./contest.interface";
import { Contest } from "./contest.model";
import QueryBuilder from "../../builder/QueryBuilder";

const createContest = async (payload: Partial<IContest>) => {
    // console.log(payload, "createContest payload");
    // Validate required fields
    if (!payload.name || !payload.categoryId || !payload.description) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Name, categoryId, and description are required');
    }
    // Validate predictions fields
    if (!payload.predictions?.minPrediction || !payload.predictions?.maxPrediction || !payload.predictions?.increment) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Prediction min, max, and increment are required');
    }
    // Validate pricing tiers
    if (!payload.pricing?.tiers || payload.pricing.tiers.length === 0) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'At least one pricing tier is required');
    }
    // Validate time
    if (payload.startTime && payload.endTime && new Date(payload.endTime) <= new Date(payload.startTime)) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'End time must be after start time');
    }

    const result = await Contest.create(payload);

    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Contest creation failed');
    }


    return result;
};
const getAllContests = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(Contest.find().populate('categoryId', 'name url group'), query)

    const result = await queryBuilder.filter()
        .sort()
        .paginate()
        .fields()
        .search(['name', 'description'])
        .modelQuery.exec()

    const meta = await queryBuilder.countTotal()

    return {
        meta,
        result
    }
};
const getContestById = async (id: string) => {

    const result = await Contest.findById(id).populate('categoryId');
    if (!result) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }
    return result;
};
const updateContest = async (id: string, payload: Partial<IContest>) => {


    // Check if contest exists
    const existingContest = await Contest.findById(id);
    if (!existingContest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }

    // Don't allow updating if contest has already started (unless it's draft)
    if (existingContest.status !== 'Draft' && existingContest.startTime <= new Date()) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot update contest that has already started');
    }

    const result = await Contest.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true
    }).populate('categoryId');

    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Contest update failed');
    }

    return result;
};
const deleteContest = async (id: string) => {
    const contest = await Contest.findById(id);
    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }

    // Don't allow deleting if contest has entries
    if (contest.totalEntries > 0) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot delete contest with existing entries');
    }

    const result = await Contest.findByIdAndUpdate(id, { status: 'Deleted' }, {
        new: true,
        runValidators: true
    });
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Contest update failed');
    }
    return result;
};
const publishContest = async (id: string) => {

    const contest = await Contest.findById(id);
    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }

    if (contest.status !== 'Draft') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Contest is already published');
    }

    // Generate predictions before publishing
    if (!contest.predictions.generatedPredictions || contest.predictions.generatedPredictions.length === 0) {
        await contest.generatePredictions();
    }

    contest.status = 'Published';
    const result = await contest.save();

    return result;
};
const generateContestPredictions = async (id: string) => {

    const contest = await Contest.findById(id);
    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }

    if (!contest.predictions.generatedPredictions || contest.predictions.generatedPredictions.length === 0) {
        await contest.generatePredictions();
    }

    const result = await contest.generatePredictions();
    return result;
};
const getActiveContests = async () => {
    const result = await Contest.find({
        status: 'Active',
        startTime: { $lte: new Date() },
        endTime: { $gte: new Date() }
    }).populate('categoryId');

    return result;
};

const getUpcomingContests = async () => {
    const result = await Contest.find({
        status: 'Active',
        startTime: { $gt: new Date() }
    }).populate('categoryId');

    return result;
};
export const ContestService = { createContest, getAllContests, getContestById, updateContest, deleteContest, publishContest, generateContestPredictions, getActiveContests, getUpcomingContests }
