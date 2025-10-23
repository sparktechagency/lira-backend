import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { User } from "../user/user.model";
import StripeService from "../../builder/StripeService";
import { Withdrawal } from "./withdrawal.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { Types } from "mongoose";

const addCardForWithdrawal = async (id: string, paymentMethodId: string) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
        customerId = await StripeService.getOrCreateCustomer(id.toString(), user.email, user.name);
        user.stripeCustomerId = customerId;
    }

    // Attach card to customer
    const paymentMethod = await StripeService.addCard(customerId, paymentMethodId);

    // Save card details to user
    const cardExists = user.savedCards?.some((card) => card.cardId === paymentMethod.id);
    if (!cardExists) {
        user?.savedCards?.push({
            cardId: paymentMethod.id,
            last4: paymentMethod.card?.last4 || '',
            brand: paymentMethod.card?.brand || '',
            expiryMonth: paymentMethod.card?.exp_month,
            expiryYear: paymentMethod.card?.exp_year,
            country: paymentMethod.card?.country,
            funding: paymentMethod.card?.funding,
            isDefault: user.savedCards.length === 0,
        } as any);
    }

    await user.save();

    return paymentMethod;

}
const getUserCards = async (id: string) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }
    return user.savedCards || [];
}
const removeCard = async (id: string, cardId: string) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Remove from Stripe
    await StripeService.removeCard(cardId);

    // Remove from database
    user.savedCards = user?.savedCards?.filter((card) => card.cardId !== cardId) || [];
    await user.save();
    return user.savedCards || [];
}
const requestWithdrawal = async (id: string, amount: number, cardId: string, withdrawalMethod: 'card' | 'bank' = 'card', ip: string, userAgent: string) => {
    if (amount < 10) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Minimum withdrawal amount is $10');
    }

    if (amount > 10000) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Maximum withdrawal amount is $10,000');
    }
    // Get user
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }
    // Check user status
    if (user.status === 'blocked') {
        throw new AppError(StatusCodes.FORBIDDEN, 'Your account is blocked');
    }
    // Calculate points needed (e.g., 1 USD = 100 points)
    const pointsNeeded = amount * 100;

    // Check if user has enough points
    if (user.points && user.points < pointsNeeded) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            `Insufficient points. You need ${pointsNeeded} points but have ${user.points} points`,
        );
    }

    // Validate card if method is card
    let selectedCard;
    if (withdrawalMethod === 'card') {
        selectedCard = user?.savedCards?.find((card) => card.cardId === cardId);
        if (!selectedCard) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Card not found');
        }

        // Check if card is debit (Stripe only allows instant payouts to debit cards)
        if (selectedCard.funding !== 'debit') {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Only debit cards are supported for withdrawals');
        }
    }

    // Check for pending withdrawals
    const pendingWithdrawal = await Withdrawal.findOne({
        user: id,
        status: { $in: ['pending', 'processing'] },
    });

    if (pendingWithdrawal) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'You already have a pending withdrawal request');
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
        user: id,
        amount,
        pointsDeducted: pointsNeeded,
        currency: 'USD',
        withdrawalMethod,
        cardDetails: selectedCard
            ? {
                cardId: selectedCard.cardId,
                last4: selectedCard.last4,
                brand: selectedCard.brand,
            }
            : undefined,
        status: 'pending',
        requestedAt: new Date(),
        metadata: {
            ipAddress: ip, // TODO: pass req.ip from controller
            userAgent: userAgent,
        },
    });

    // Deduct points from user
    user.points = (user.points || 0) - pointsNeeded;
    await user.save();
    return withdrawal;
}
const getUserWithdrawals = async (id: string, query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(Withdrawal.find({ user: id }), query)

    const result = await queryBuilder
        .filter()
        .sort()
        .paginate()
        .fields()
        .modelQuery.exec();

    const meta = await queryBuilder.countTotal();
    return {
        meta,
        result,
    }

}
const getWithdrawalDetails = async (id: string, userId: string) => {
    const withdrawal = await Withdrawal.findOne({
        _id: id,
        user: userId,
    });

    if (!withdrawal) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Withdrawal not found');
    }
    return withdrawal;
}
const cancelWithdrawal = async (id: string, userId: string) => {
    const withdrawal = await Withdrawal.findOne({
        _id: id,
        user: userId,
    });

    if (!withdrawal) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Withdrawal not found');
    }

    if (withdrawal.status !== 'pending') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot cancel this withdrawal. It is already being processed.');
    }

    // Return points to user
    await User.findByIdAndUpdate(userId, {
        $inc: { points: withdrawal.pointsDeducted },
    });

    // Update withdrawal status
    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = 'Cancelled by user';
    await withdrawal.save();
    return withdrawal;
}
const getUserWallet = async (id: string) => {
    const user = await User.findById(id).select('points wallet');
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const pendingWithdrawals = await Withdrawal.find({
        user: id,
        status: { $in: ['pending', 'processing'] },
    });

    const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    return {
        points: user.points || 0,
        pendingWithdrawalAmount: pendingAmount,
        wallet: user.wallet || 0,
    }
}
const getAllWithdrawals = async (queryParam: Record<string, unknown>) => {
    const { status, page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = queryParam;
    const query: any = {};

    // Filter by status
    if (status && status !== 'all') {
        query.status = status;
    }

    // Search by user name/email
    if (search) {
        const users = await User.find({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ],
        }).select('_id');

        const userIds = users.map((u) => u._id);
        query.user = { $in: userIds };
    }

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const withdrawals = await Withdrawal.find(query)
        .populate('user', 'name email image points')
        .populate('processedBy', 'name email')
        .sort(sort)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

    const total = await Withdrawal.countDocuments(query);

    // Calculate statistics
    const stats = await Withdrawal.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
            },
        },
    ]);
}
const getWithdrawalById = async (withdrawalId: string) => {
    const withdrawal = await Withdrawal.findById(withdrawalId)
        .populate('user', 'name email image points stripeCustomerId savedCards')
        .populate('processedBy', 'name email');

    if (!withdrawal) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Withdrawal not found');
    }
    return withdrawal;
}

const approveWithdrawal = async (withdrawalId: string, adminId: string, payoutMethod: string, adminNote: string) => {
    // Get withdrawal with user details
    const withdrawal = await Withdrawal.findById(withdrawalId).populate('user');

    if (!withdrawal) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Withdrawal not found');
    }

    if (withdrawal.status !== 'pending') {
        throw new AppError(StatusCodes.BAD_REQUEST, `Cannot approve. Current status: ${withdrawal.status}`);
    }

    const user = withdrawal.user as any;

    // Update status to processing
    withdrawal.status = 'processing';
    withdrawal.processedBy = new Types.ObjectId(adminId);
    withdrawal.processedAt = new Date();
    if (adminNote) {
        withdrawal.adminNote = adminNote;
    }
    await withdrawal.save();

    try {
        // Calculate payout fee
        const fee = StripeService.calculatePayoutFee(withdrawal.amount, payoutMethod as 'instant' | 'standard');
        const netAmount = withdrawal.amount - fee;

        let payout;

        if (withdrawal.withdrawalMethod === 'card') {
            // Send money to card via Stripe
            if (payoutMethod === 'instant') {
                payout = await StripeService.createCardPayout(
                    netAmount,
                    withdrawal.currency,
                    withdrawal.cardDetails!.cardId,
                    {
                        withdrawalId: withdrawalId,
                        userId: user._id.toString(),
                        userEmail: user.email,
                        method: 'instant',
                    },
                );
            } else {
                payout = await StripeService.createStandardPayout(
                    netAmount,
                    withdrawal.currency,
                    withdrawal.cardDetails!.cardId,
                    {
                        withdrawalId: withdrawalId,
                        userId: user._id.toString(),
                        userEmail: user.email,
                        method: 'standard',
                    },
                );
            }

            withdrawal.stripePayoutId = payout.id;
        }

        // Update withdrawal to completed
        withdrawal.status = 'completed';
        withdrawal.completedAt = new Date();
        await withdrawal.save();

        // Update user wallet stats
        await User.findByIdAndUpdate(user._id, {
            $inc: {
                'wallet.totalWithdrawn': withdrawal.amount,
            },
        });

        // Send notification to user (implement your notification service)
        // await sendNotification(user._id, 'Withdrawal approved', `Your withdrawal of $${withdrawal.amount} has been processed.`);


        return {
            withdrawal,
            payout: {
                id: payout?.id,
                status: payout?.status,
                amount: netAmount,
                fee,
                method: payoutMethod,
            },
        }

    } catch (error: any) {
        // If Stripe payout fails, refund points and mark as failed
        await User.findByIdAndUpdate(user._id, {
            $inc: { points: withdrawal.pointsDeducted },
        });

        withdrawal.status = 'failed';
        withdrawal.rejectionReason = `Payout failed: ${error.message}`;
        await withdrawal.save();

        throw new AppError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Payout processing failed: ${error.message}. Points have been refunded to user.`,
        );
    }
}
const rejectWithdrawal = async (withdrawalId: string, adminId: string, adminNote: string) => {
    if (!adminNote) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Rejection reason is required');
    }

    const withdrawal = await Withdrawal.findById(withdrawalId).populate('user');

    if (!withdrawal) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Withdrawal not found');
    }

    if (withdrawal.status !== 'pending') {
        throw new AppError(StatusCodes.BAD_REQUEST, `Cannot reject. Current status: ${withdrawal.status}`);
    }

    const user = withdrawal.user as any;

    // Refund points to user
    await User.findByIdAndUpdate(user._id, {
        $inc: { points: withdrawal.pointsDeducted },
    });

    // Update withdrawal
    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = adminNote;
    withdrawal.processedBy = new Types.ObjectId(adminId);
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    // Send notification to user
    // await sendNotification(user._id, 'Withdrawal rejected', adminNote);

    return withdrawal;
}
const getWithdrawalStats = async (query: Record<string, unknown>) => {
    const dateFilter: Record<string, unknown> = {};
    if (query.startDate) dateFilter.$gte = new Date(query.startDate as string);
    if (query.endDate) dateFilter.$lte = new Date(query.endDate as string);

    const queryFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Overall stats
    const totalStats = await Withdrawal.aggregate([
        { $match: queryFilter },
        {
            $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                totalPointsDeducted: { $sum: '$pointsDeducted' },
            },
        },
    ]);

    // Status-wise breakdown
    const statusBreakdown = await Withdrawal.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
            },
        },
    ]);

    // Method-wise breakdown
    const methodBreakdown = await Withdrawal.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$withdrawalMethod',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
            },
        },
    ]);

    // Daily trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrend = await Withdrawal.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                count: { $sum: 1 },
                amount: { $sum: '$amount' },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Top users by withdrawal amount
    const topUsers = await Withdrawal.aggregate([
        { $match: { status: 'completed', ...query } },
        {
            $group: {
                _id: '$user',
                totalWithdrawn: { $sum: '$amount' },
                withdrawalCount: { $sum: 1 },
            },
        },
        { $sort: { totalWithdrawn: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: '$user' },
        {
            $project: {
                _id: 1,
                totalWithdrawn: 1,
                withdrawalCount: 1,
                'user.name': 1,
                'user.email': 1,
                'user.image': 1,
            },
        },
    ]);
    return {
        totalStats: totalStats[0] || { totalRequests: 0, totalAmount: 0, totalPointsDeducted: 0 },
        statusBreakdown,
        methodBreakdown,
        dailyTrend,
        topUsers,
    };
}
const retryFailedWithdrawal = async (withdrawalId: string, payoutMethod: 'instant' | 'standard') => {
    const withdrawal = await Withdrawal.findById(withdrawalId).populate('user');

    if (!withdrawal) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Withdrawal not found');
    }

    if (withdrawal.status !== 'failed') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Can only retry failed withdrawals');
    }

    const user = withdrawal.user as any;

    // Reset status to processing
    withdrawal.status = 'processing';
    withdrawal.rejectionReason = undefined;
    await withdrawal.save();

    const fee = StripeService.calculatePayoutFee(withdrawal.amount, payoutMethod as 'instant' | 'standard');
    const netAmount = withdrawal.amount - fee;

    let payout;
    if (payoutMethod === 'instant') {
        payout = await StripeService.createCardPayout(netAmount, withdrawal.currency, withdrawal.cardDetails!.cardId, {
            withdrawalId: withdrawalId,
            userId: user._id.toString(),
            retry: 'true',
        });
    } else {
        payout = await StripeService.createStandardPayout(netAmount, withdrawal.currency, withdrawal.cardDetails!.cardId, {
            withdrawalId: withdrawalId,
            userId: user._id.toString(),
            retry: 'true',
        });
    }

    withdrawal.status = 'completed';
    withdrawal.stripePayoutId = payout.id;
    withdrawal.completedAt = new Date();
    await withdrawal.save();
    return withdrawal;
}


const checkPayoutStatus = async (withdrawalId: string) => {
    const withdrawal = await Withdrawal.findById(withdrawalId);

    if (!withdrawal) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Withdrawal not found');
    }

    if (!withdrawal.stripePayoutId) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'No Stripe payout ID found');
    }

    // Fetch real-time status from Stripe
    const payoutStatus = await StripeService.getPayoutStatus(withdrawal.stripePayoutId);

    // Update local status if changed
    if (payoutStatus.status === 'paid' && withdrawal.status !== 'completed') {
        withdrawal.status = 'completed';
        withdrawal.completedAt = new Date();
        await withdrawal.save();
    } else if (payoutStatus.status === 'failed' && withdrawal.status !== 'failed') {
        withdrawal.status = 'failed';
        withdrawal.rejectionReason = payoutStatus.failure_message || 'Payout failed';
        await withdrawal.save();

        // Refund points
        await User.findByIdAndUpdate(withdrawal.user, {
            $inc: { points: withdrawal.pointsDeducted },
        });
    }
    return {
        withdrawal,
        payoutStatus,
    };
}
export const WithdrawalService = {
    addCardForWithdrawal,
    getUserCards,
    removeCard,
    requestWithdrawal,
    getUserWithdrawals,
    getWithdrawalDetails,
    cancelWithdrawal,
    getUserWallet,
    getAllWithdrawals,
    getWithdrawalById,
    approveWithdrawal,
    rejectWithdrawal,
    getWithdrawalStats,
    retryFailedWithdrawal,
    checkPayoutStatus,
}
