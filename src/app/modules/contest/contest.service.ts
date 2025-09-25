import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { IContest } from "./contest.interface";
import { Contest } from "./contest.model";
import QueryBuilder from "../../builder/QueryBuilder";

const createContest = async (payload: Partial<IContest>) => {
    // Validate required fields
    if (!payload.name || !payload.categoryId || !payload.description) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Name, categoryId, and description are required');
    }

    // Validate predictions tiers
    if (!payload.predictions?.tiers || payload.predictions.tiers.length === 0) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'At least one prediction tier is required');
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
    const queryBuilder = new QueryBuilder(Contest.find().populate('categoryId'), query)

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
export const ContestService = { createContest, getAllContests, getContestById }
