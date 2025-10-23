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
    const { cardId } = req.body;
    const result = await WithdrawalService.removeCard(id, cardId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Card removed for withdrawal successfully',
        data: result,
    })
})

const requestWithdrawal = catchAsync(async (req, res) => {
    const { ip } = req as { ip: string };
    const userAgent = req.headers['user-agent'] as string;
    const { id } = req.user as { id: string };
    const { amount, cardId, withdrawalMethod = 'card' } = req.body;
    const result = await WithdrawalService.requestWithdrawal(id, amount, cardId, withdrawalMethod, ip, userAgent);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Withdrawal request submitted successfully. Admin will review it soon.',
        data: result,
    });
})
const getUserWithdrawals = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await WithdrawalService.getUserWithdrawals(id, req.query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'User withdrawals retrieved successfully',
        data: result,
    })
})
const getWithdrawalDetails = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { id: userId } = req.user as { id: string };
    const result = await WithdrawalService.getWithdrawalDetails(id, userId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Withdrawal details retrieved successfully',
        data: result,
    })
})
const cancelWithdrawal = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { id: userId } = req.user as { id: string };
    const result = await WithdrawalService.cancelWithdrawal(id, userId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Withdrawal cancelled successfully',
        data: result,
    })
})
const getUserWallet = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await WithdrawalService.getUserWallet(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'User wallet retrieved successfully',
        data: result,
    })
})
const getAllWithdrawals = catchAsync(async (req, res) => {
    const result = await WithdrawalService.getAllWithdrawals(req.query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'All withdrawals retrieved successfully',
        data: result,
    })
})
const getWithdrawalById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await WithdrawalService.getWithdrawalById(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Withdrawal details retrieved successfully',
        data: result,
    })
})
const approveWithdrawal = catchAsync(async (req, res) => {
    const { withdrawalId } = req.params;
    const { payoutMethod = 'instant', adminNote } = req.body; // instant or standard
    const { id: adminId } = req.user as { id: string };
    const result = await WithdrawalService.approveWithdrawal(withdrawalId, adminId, payoutMethod, adminNote);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Withdrawal approved successfully',
        data: result,
    })
})
export const WithdrawalController = {
    addCardForWithdrawal,
    getUserCards,
    removeCard,
    requestWithdrawal,
    getUserWithdrawals,
    getWithdrawalDetails,
    cancelWithdrawal,
    getUserWallet,
}
