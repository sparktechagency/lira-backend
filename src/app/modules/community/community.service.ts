import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { ICommunity } from "./community.interface";
import { CommunityModel, CommunityVoteModel } from "./community.model";
import QueryBuilder from "../../builder/QueryBuilder";


const createCommunity = async (userId: string, payload: ICommunity) => {
    const data = { ...payload, userId };
    const result = await CommunityModel.create(data);
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create community vote');
    }
    return result;
}
const approveCommunity = async (id: string, status: string) => {
    if (status !== 'approved' && status !== 'rejected') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid status value. Must be "approved" or "rejected".');
    }
    const result = await CommunityModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to approve community vote');
    }
    return result;
}
const getCommunityPosts = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(CommunityModel.find(), query)
    const result = await queryBuilder.filter()
        .sort()
        .paginate()
        .fields()
        .search(['title', 'description'])
        .modelQuery
        .exec();
    const meta = await queryBuilder.countTotal();
    return {
        meta,
        result,
    };
}

const upVoteCommunity = async (postId: string, userId: string) => {
    const existingVote = await CommunityVoteModel.findOne({ userId, postId });

    if (existingVote) {
       
        if (existingVote.vote === true) {
    
            await CommunityVoteModel.deleteOne({ userId, postId });
            await CommunityModel.findByIdAndUpdate(postId, { $inc: { upvote: -1 } });
        } else if (existingVote.vote === false) {
            existingVote.vote = true;
            await existingVote.save();
            await CommunityModel.findByIdAndUpdate(postId, {
                $inc: { upvote: 1, downvote: -1 }
            });
        }
    } else {
        await CommunityVoteModel.create({ userId, postId, vote: true });
        await CommunityModel.findByIdAndUpdate(postId, { $inc: { upvote: 1 } });
    }

    return await CommunityModel.findById(postId);
};

const getVotedPosts = async (userId: string) => {
    const votedPosts = await CommunityVoteModel.find({ userId })
        .populate({
            path: 'postId',
            populate: {
                path: 'userId',
                select: 'name email' // User এর যা যা field চান
            }
        });

    return votedPosts.map(vote => ({
        ...(vote.postId as any).toObject(),
        userVote: vote.vote // true = upvote, false = downvote
    }));
};
export const CommunityService = {
    createCommunity,
    approveCommunity,
    getCommunityPosts,
    upVoteCommunity,
    getVotedPosts,
}