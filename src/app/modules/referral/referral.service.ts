import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import crypto from 'crypto';
import AppError from '../../../errors/AppError';
import { User } from '../user/user.model';

// Points awarded for successful referrals
const REFERRAL_POINTS = 10;

// Generate a unique referral code
const generateReferralCode = async (userId: string): Promise<string> => {
  // Create a base code using the first part of userId and random bytes
  const baseCode = userId.substring(0, 5) + crypto.randomBytes(3).toString('hex');

  // Check if code already exists
  const existingUser = await User.findOne({ referralCode: baseCode });

  // If code exists, generate a new one recursively
  if (existingUser) {
    return generateReferralCode(userId);
  }

  return baseCode;
};

// Get or create a referral code for a user
const getUserReferralCode = async (userId: string): Promise<string> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // If user already has a referral code, return it
  if (user.referralCode) {
    return user.referralCode;
  }

  // Generate a new referral code
  const referralCode = await generateReferralCode(userId.toString());

  // Update user with the new referral code
  await User.findByIdAndUpdate(userId, { referralCode });

  return referralCode;
};

// Accept a referral invitation
const acceptReferral = async (
  userId: string,
  referralCode: string
): Promise<boolean> => {
  // Find the referring user
  const referrer = await User.findOne({ referralCode });

  if (!referrer) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Invalid referral code');
  }

  // Check if the user is trying to refer themselves
  if (referrer._id.toString() === userId.toString()) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You cannot refer yourself');
  }

  // Check if user has already been referred
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user.referredBy) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You have already been referred');
  }

  // Update the user with the referral information
  await User.findByIdAndUpdate(userId, {
    referredBy: referrer._id,
    points: (user.points || 0) + REFERRAL_POINTS
  });

  // Update the referrer's stats
  await User.findByIdAndUpdate(referrer._id, {
    $inc: {
      referralCount: 1,
      points: REFERRAL_POINTS
    }
  });

  return true;
};

// Get referral statistics for a user
const getReferralStats = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Get users referred by this user
  const referredUsers = await User.find({ referredBy: userId })
    .select('name email image createdAt');

  return {
    referralCode: user.referralCode || await getUserReferralCode(userId),
    referralCount: user.referralCount || 0,
    points: user.points || 0,
    referredUsers
  };
};

export const ReferralService = {
  getUserReferralCode,
  acceptReferral,
  getReferralStats
};