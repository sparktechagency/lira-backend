import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CommunityService } from "./community.service";


const createCommunity = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await CommunityService.createCommunity(id, req.body);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Community post created successfully',
        data: result,
    });
});
const approveCommunity = catchAsync(async (req, res) => {
    const { communityId } = req.params;
    const { status } = req.body;
    const result = await CommunityService.approveCommunity(communityId, status);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Community post approved successfully',
        data: result,
    });
});
const getCommunityPosts = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await CommunityService.getCommunityPosts(req.query, id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Community posts retrieved successfully',
        data: result.result,
        // meta: result.meta,
    });
});
const getSingleCommunityPost = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const result = await CommunityService.getSingleCommunityPost(postId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Community post retrieved successfully',
        data: result,
    });
});
const upVoteCommunity = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const { id } = req.user as { id: string };
    const result = await CommunityService.upVoteCommunity(postId, id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Community post upvoted successfully',
        data: result,
    });
});
const getVotedPosts = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await CommunityService.getVotedPosts(id, req.query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Voted posts retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
});

const getMyPosts = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await CommunityService.getMyPosts(id, req.query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'My posts retrieved successfully',
        data: result.result,
        meta: result.meta,
    });
});
const downVoteCommunity = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const { id } = req.user as { id: string };
    const result = await CommunityService.downVoteCommunity(postId, id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Community post down voted successfully',
        data: result,
    });
});

const deleteCommunityPost = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const result = await CommunityService.deleteCommunityPost(postId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Community post deleted successfully',
        data: result,
    });
});



export const CommunityController = {
    createCommunity,
    approveCommunity,
    getCommunityPosts,
    upVoteCommunity,
    getVotedPosts,
    getMyPosts,
    downVoteCommunity,
    getSingleCommunityPost,
    deleteCommunityPost,
}