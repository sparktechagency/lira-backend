import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { User } from "../user/user.model";
import StripeService from "../../builder/StripeService";
import { Withdrawal } from "./withdrawal.model";

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
export const WithdrawalService = {
    addCardForWithdrawal,
    getUserCards,
    removeCard,
    requestWithdrawal
}
