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
const approveCommunityVote = async (id: string, status: string) => {
    if (status !== 'approved' && status !== 'rejected') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid status value. Must be "approved" or "rejected".');
    }
    const result = await CommunityVoteModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to approve community vote');
    }
    return result;
}
export const CommunityService = {
    createCommunityVote,
    approveCommunityVote,
}