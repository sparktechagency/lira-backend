import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { IContest } from "./contest.interface";
import { Contest } from "./contest.model";

const createContest = async (payload: IContest) => {
    const result = await Contest.create(payload);

    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Contest creation failed');
    }

    return result;

}
export const ContestService = { createContest }
