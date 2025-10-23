import { StatusCodes } from "http-status-codes"
import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse"
import { WithdrawalService } from "./withdrawal.service";

const addCardForWithdrawal = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const { paymentMethodId } = req.body;
    const result = await WithdrawalService.addCardForWithdrawal(id, paymentMethodId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Card added for withdrawal successfully',
        data: result,
    })
})
const getUserCards = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await WithdrawalService.getUserCards(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'User cards retrieved successfully',
        data: result,
    })
})
const removeCard = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const { paymentMethodId } = req.body;
    const result = await WithdrawalService.removeCard(id, paymentMethodId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Card removed for withdrawal successfully',
        data: result,
    })
})


export const WithdrawalController = {}