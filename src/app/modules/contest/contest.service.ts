import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { IContest } from "./contest.interface";
import { Contest } from "./contest.model";

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


export const ContestService = { createContest }
