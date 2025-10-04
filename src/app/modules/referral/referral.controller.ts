import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ReferralService } from './referral.service';

const getReferralCode = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user as { id: string };
  
  const referralCode = await ReferralService.getUserReferralCode(id);
  
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Referral code retrieved successfully',
    data: { referralCode },
  });
});

const acceptReferral = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user as { id: string };
  const { referralCode } = req.body;
  
  await ReferralService.acceptReferral(id, referralCode);
  
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Referral accepted successfully',
    data: null,
  });
});

const getReferralStats = catchAsync(async (req: Request, res: Response) => {
 const { id } = req.user as { id: string };
  
  const stats = await ReferralService.getReferralStats(id);
  
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Referral statistics retrieved successfully',
    data: stats,
  });
});

export const ReferralController = {
  getReferralCode,
  acceptReferral,
  getReferralStats,
};