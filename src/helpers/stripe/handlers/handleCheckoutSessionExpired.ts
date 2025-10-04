import { StatusCodes } from "http-status-codes";
import { Order } from "../../../app/modules/order/order.model";
import { Payment } from "../../../app/modules/payments/payments.model";
import stripe from "../../../config/stripe";
import AppError from "../../../errors/AppError";
import Stripe from "stripe";

export const handleCheckoutSessionExpired = async (data: Stripe.Subscription) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(data.id);
        const { orderId, paymentId } = session.metadata || {};

        // Update payment status
        await Payment.findByIdAndUpdate(paymentId, {
            status: 'failed',
        });

        // Update order status
        await Order.findByIdAndUpdate(orderId, {
            status: 'cancelled',
        });

        // DO NOT update contest entries - payment failed

        return { success: true, message: 'Payment cancelled' };
    } catch (error: any) {
        console.error('Error handling failed payment:', error);
        throw new AppError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to handle payment cancellation: ${error.message}`
        );
    }
};
