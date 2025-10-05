import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { ICommunityVote } from "./community.interface";
import { CommunityVoteModel } from "./community.model";
import QueryBuilder from "../../builder/QueryBuilder";


const createCommunity = async (userId: string, payload: ICommunityVote) => {
    const data = { ...payload, userId };
    const result = await CommunityVoteModel.create(data);
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create community vote');
    }
    return result;
}
const approveCommunity = async (id: string, status: string) => {
    if (status !== 'approved' && status !== 'rejected') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid status value. Must be "approved" or "rejected".');
    }
    const result = await CommunityVoteModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to approve community vote');
    }
    return result;
}
const getCommunityPosts = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(CommunityVoteModel.find(), query)

    const result = await queryBuilder.filter()
        .sort()
        .paginate()
        .fields()
        .modelQuery
        .exec();
    const meta = await queryBuilder.countTotal();
    return {
        meta,
        result,
    };
}
export const CommunityService = {
    createCommunity,
    approveCommunity,
    getCommunityPosts,
}