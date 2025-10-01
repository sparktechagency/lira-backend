import { StatusCodes } from 'http-status-codes';
import stripe from '../../../config/stripe';
import AppError from '../../../errors/AppError';
import { IPayment } from './payments.interface';
import { Payment } from './payments.model';

const createPayment = async (payload: IPayment): Promise<IPayment> => {
     // Create a payment record
     const result = await Payment.create(payload);
     return result;
};

const getAllPayments = async (query: Record<string, unknown>) => {};

const getSinglePayment = async (id: string): Promise<IPayment | null> => {
     const result = await Payment.findById(id).populate('userId').populate('productIds');
     return result;
};

const updatePayment = async (id: string, payload: Partial<IPayment>): Promise<IPayment | null> => {
     const payment = await Payment.findById(id);

     if (!payment) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Payment not found');
     }

     // If updating to completed status, set paidAt date
     if (payload.status === 'paid' && payment.status !== 'paid') {
          payload.paidAt = new Date();
     }

     // If updating to refunded status, set refundedAt date
     if (payload.status === 'refunded' && payment.status !== 'refunded') {
          payload.refundedAt = new Date();

          // Process refund in Stripe if payment was made with Stripe
          if (payment.paymentMethod === 'stripe' && payment.paymentIntentId) {
               try {
                    await stripe.refunds.create({
                         payment_intent: payment.paymentIntentId,
                         amount: payload.refundAmount ? Math.round(payload.refundAmount * 100) : undefined,
                    });
               } catch (error: any) {
                    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to process refund: ${error.message}`);
               }
          }
     }

     const result = await Payment.findByIdAndUpdate(id, payload, {
          new: true,
          runValidators: true,
     });

     return result;
};

const deletePayment = async (id: string): Promise<IPayment | null> => {
     const result = await Payment.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
     return result;
};

const processStripeWebhook = async (event: any): Promise<void> => {
     try {
          switch (event.type) {
               case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object;
                    await handlePaymentIntentSucceeded(paymentIntent);
                    break;
               case 'checkout.session.completed':
                    const session = event.data.object;
                    await handleCheckoutSessionCompleted(session);
                    break;
               default:
                    console.log(`Unhandled event type ${event.type}`);
          }
     } catch (error) {
          console.error(`Error processing webhook event ${event.type}:`, error);
          throw error;
     }
};

const handlePaymentIntentSucceeded = async (paymentIntent: any): Promise<void> => {
     try {
          // Find payment by paymentIntentId
          const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });

          if (payment && payment.status !== 'paid') {
               // Update payment status to completed
               await Payment.findByIdAndUpdate(
                    payment._id,
                    {
                         status: 'completed',
                         paidAt: new Date(),
                    },
                    { new: true },
               );

               console.log(`Payment ${payment._id} marked as completed`);
          }
     } catch (error) {
          console.error('Error handling payment intent succeeded:', error);
     }
};

const handleCheckoutSessionCompleted = async (session: any): Promise<void> => {
     try {
          // Find payment by paymentSessionId
          const payment = await Payment.findOne({ paymentSessionId: session.id });

          if (payment && payment.status !== 'paid') {
               // Update payment status to completed
               await Payment.findByIdAndUpdate(
                    payment._id,
                    {
                         status: 'paid',
                         paidAt: new Date(),
                    },
                    { new: true },
               );

               console.log(`Payment ${payment._id} marked as completed from checkout session`);
          }
     } catch (error) {
          console.error('Error handling checkout session completed:', error);
     }
};

export const PaymentService = {
     createPayment,
     getAllPayments,
     getSinglePayment,
     updatePayment,
     deletePayment,
     processStripeWebhook,
};
