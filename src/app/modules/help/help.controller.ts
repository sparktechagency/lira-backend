import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { HelpService } from "./help.service";

const createHelp = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await HelpService.createHelp({
        userId: id,
        ...req.body,
    });
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.CREATED,
        message: 'Help created successfully',
        data: result,
    });
});
export const HelpController = {
    createHelp,
    //   getHelp,
};
