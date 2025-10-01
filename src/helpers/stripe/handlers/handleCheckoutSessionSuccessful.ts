import { StatusCodes } from "http-status-codes";
import { Order } from "../../../app/modules/order/order.model";
import { Payment } from "../../../app/modules/payments/payments.model";
import stripe from "../../../config/stripe";
import AppError from "../../../errors/AppError";
import { Contest } from "../../../app/modules/contest/contest.model";

export const handleCheckoutSessionSuccessful = async (sessionId: string) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const { orderId, paymentId, contestId } = session.metadata || {};

        // Update payment status
        await Payment.findByIdAndUpdate(paymentId, {
            status: 'completed',
            paymentDate: new Date(),
        });

        // Update order status
        const order = await Order.findByIdAndUpdate(
            orderId,
            { status: 'processing' },
            { new: true }
        );

        if (!order) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
        }

        // NOW update contest prediction entries
        const contest = await Contest.findById(contestId);
        if (!contest) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
        }

        // Update each prediction's entries
        let totalEntriesAdded = 0;
        for (const orderedPrediction of order.predictions) {
            const prediction = contest.predictions.generatedPredictions?.find(
                (p: any) => p._id?.toString() === orderedPrediction.predictionId.toString()
            );

            if (prediction) {
                // Increment current entries by 1 (each user gets 1 entry)
                prediction.currentEntries += 1;
                totalEntriesAdded += 1;

                // Check if max entries reached
                if (prediction.currentEntries >= prediction.maxEntries) {
                    prediction.isAvailable = false;
                }
            }
        }

        // Update total entries in contest
        contest.totalEntries += totalEntriesAdded;

        // Save contest with updated entries
        await contest.save();

        console.log(`✅ Payment successful: ${totalEntriesAdded} entries added to contest ${contestId}`);

        return {
            success: true,
            message: 'Payment processed successfully',
            entriesAdded: totalEntriesAdded,
        };
    } catch (error: any) {
        console.error('❌ Error handling successful payment:', error);
        throw new AppError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to process payment: ${error.message}`
        );
    }
};
