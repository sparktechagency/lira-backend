import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { User } from "../user/user.model";
import StripeService from "../../builder/StripeService";

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
const removeCard = async (id: string, paymentMethodId: string) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Remove from Stripe
    await StripeService.removeCard(paymentMethodId);

    // Remove from database
    user.savedCards = user?.savedCards?.filter((card) => card.cardId !== paymentMethodId) || [];
    await user.save();
    return user.savedCards || [];
}
export const WithdrawalService = {
    addCardForWithdrawal,
    getUserCards
}
