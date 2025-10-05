import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CommunityService } from "./community.service";


const createCommunityVote = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await CommunityService.createCommunityVote(id, req.body);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Community vote created successfully',
        data: result,
    });
});
export const CommunityController = {
    createCommunityVote,
}