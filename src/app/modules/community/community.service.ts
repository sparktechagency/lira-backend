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
const downVoteCommunity = async (postId: string, userId: string) => {
    const existingVote = await CommunityVoteModel.findOne({ userId, postId });

    if (existingVote) {

        if (existingVote.vote === false) {

            await CommunityVoteModel.deleteOne({ userId, postId });
            await CommunityModel.findByIdAndUpdate(postId, { $inc: { downvote: -1 } });
        } else if (existingVote.vote === true) {
            existingVote.vote = false;
            await existingVote.save();
            await CommunityModel.findByIdAndUpdate(postId, {
                $inc: { upvote: -1, downvote: 1 }
            });
        }
    } else {
        await CommunityVoteModel.create({ userId, postId, vote: false });
        await CommunityModel.findByIdAndUpdate(postId, { $inc: { downvote: 1 } });
    }

    return await CommunityModel.findById(postId);
};
const getVotedPosts = async (userId: string, query: Record<string, unknown>) => {
    // Calculate skip value for pagination
    const skip = (Number(query.page) - 1) * Number(query.limit);

    // Build search query for Community posts
    const searchQuery: any = {};
    const searchTerm = query.searchTerm as string;
    if (searchTerm) {
        searchQuery.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } }
        ];
    }
    const sort = query.sort as string || 'createdAt';
    const sortOrder = query.sortOrder as string || 'desc';
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    // First, get all voted post IDs by this user
    const userVotes = await CommunityVoteModel.find({ userId }).select('postId vote');
    const votedPostIds = userVotes.map(vote => vote.postId);

    if (votedPostIds.length === 0) {
        return {
            data: [],
            meta: {
                page,
                limit,
                total: 0,
                totalPage: 0
            }
        };
    }

    // Add voted post IDs to query
    searchQuery._id = { $in: votedPostIds };

    // Get total count for pagination
    const total = await CommunityModel.countDocuments(searchQuery);

    // Build sort object
    const sortOptions: any = {};
    sortOptions[sort] = sortOrder === 'asc' ? 1 : -1;

    // Fetch posts with pagination and search
    const posts = await CommunityModel.find(searchQuery)
        .populate('userId', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();

    // Create a map of user votes for quick lookup
    const voteMap = new Map(
        userVotes.map(vote => [vote.postId.toString(), vote.vote])
    );

    // Add userVote to each post
    const postsWithVotes = posts.map(post => ({
        ...post,
        userVote: voteMap.get(post._id.toString())
    }));

    return {
        data: postsWithVotes,
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit)
        }
    };
};
const getMyPosts = async (userId: string, query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(CommunityModel.find(), query)
        .filter()
        .sort()
        .paginate()
        .fields()
        .search(['title', 'description']);
    const result = await queryBuilder.modelQuery.exec();
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
    upVoteCommunity,
    getVotedPosts,
    getMyPosts,
    downVoteCommunity,
}