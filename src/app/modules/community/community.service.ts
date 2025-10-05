import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { ICommunityVote } from "./community.interface";
import { CommunityVoteModel } from "./community.model";

const createCommunityVote = async (userId: string, payload: ICommunityVote) => {
    const data = { ...payload, userId };
    const result = await CommunityVoteModel.create(data);
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create community vote');
    }
    return result;
}

export const CommunityService = {
    createCommunityVote,
}