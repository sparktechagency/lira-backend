import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IProductOrder } from './order.interface';
import stripe from '../../../config/stripe';
import config from '../../../config';
import { User } from '../user/user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import generateOrderNumber from '../../../utils/generateOrderNumber';
import { Contest } from '../contest/contest.model';
import { Order } from './order.model';
import { Payment } from '../payments/payments.model';
import { Types } from 'mongoose';


interface IOrderPayload {
     id: string;
     contestId: string;
     generatedPredictionsIds?: Array<{ id: string }>;
     customPredictions?: Array<{ value: number }>;
}

const createContestOrder = async (userId: string, payload: IOrderPayload) => {
     const { contestId, generatedPredictionsIds = [], customPredictions = [] } = payload;

     // Validate user exists
     const user = await User.findById(userId);
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found!');
     }

     // Validate contest exists and is active
     const contest = await Contest.findById(contestId);
     if (!contest) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found!');
     }

     // Check contest status
     if (contest.status !== 'Active') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Contest is not active!');
     }

     // Check contest time validity
     const now = new Date();
     if (now < contest.startTime) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Contest has not started yet!');
     }

     if (now > contest.endOffsetTime) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Contest selection time has ended!');
     }

     let totalAmount = 0;
     const orderedPredictions = [];
     const orderedCustomPredictions = [];

     // Process generated predictions
     for (const item of generatedPredictionsIds) {
          const prediction = contest.predictions.generatedPredictions?.find(
               (p: any) => p._id.toString() === item.id
          );

          if (!prediction) {
               throw new AppError(
                    StatusCodes.NOT_FOUND,
                    `Prediction with ID ${item.id} not found in this contest!`
               );
          }

          if (!prediction.isAvailable) {
               throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    `Prediction with value ${prediction.value} is no longer available!`
               );
          }

          if (prediction.currentEntries >= prediction.maxEntries) {
               throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    `Maximum entries reached for prediction ${prediction.value}!`
               );
          }

          totalAmount += prediction.price;

          orderedPredictions.push({
               predictionId: (prediction as any)._id,
               predictionValue: prediction.value,
               tierId: prediction.tierId,
               price: prediction.price,
          });
     }

     // Process custom predictions
     if (customPredictions.length > 0) {
          // Get tiers from contest
          const tiers = contest.pricing.tiers;
          
          if (!tiers || tiers.length === 0) {
               throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    'No tiers found for this contest!'
               );
          }

          // Get increment from contest configuration
          const increment = contest.predictions.increment || 1;

          // Sort tiers by minValue to properly check ranges
          const sortedTiers = [...tiers].sort((a: any, b: any) => a.minValue - b.minValue);
          const lastTier = sortedTiers[sortedTiers.length - 1];

          for (const customPred of customPredictions) {
               const { value } = customPred;

               // Validate increment
               if (value % increment !== 0) {
                    throw new AppError(
                         StatusCodes.BAD_REQUEST,
                         `Custom prediction value ${value} is not valid! Must be a multiple of ${increment}.`
                    );
               }

               // Determine price based on value and tier ranges
               let price = 0;
               let matchedTier = null;
               
               const firstTier = sortedTiers[0];
               
               if (value < firstTier.min) {
                    // If value is less than first tier's min, use first tier's price
                    price = firstTier.pricePerPrediction;
                    matchedTier = firstTier;
               } else if (value > lastTier.max) {
                    // If value exceeds last tier's max, use last tier's price
                    price = lastTier.pricePerPrediction;
                    matchedTier = lastTier;
               } else {
                    // Find which tier range the value falls into
                    matchedTier = sortedTiers.find((t: any) => 
                         value >= t.min && value <= t.max
                    );

                    // If no matching tier found in between, use the closest tier
                    if (!matchedTier) {
                         // Find the closest tier by checking which range it's nearest to
                         for (let i = 0; i < sortedTiers.length - 1; i++) {
                              if (value > sortedTiers[i].max && value < sortedTiers[i + 1].min) {
                                   // Value is in gap between tiers, use the lower tier's price
                                   matchedTier = sortedTiers[i];
                                   break;
                              }
                         }
                         // If still not found, use last tier as fallback
                         if (!matchedTier) {
                              matchedTier = lastTier;
                         }
                    }

                    price = matchedTier.pricePerPrediction;
               }

               totalAmount += price;

               orderedCustomPredictions.push({
                    predictionValue: value,
                    tierId: (matchedTier as any)._id,
                    price: price,
               });
          }
     }

     // Generate unique order ID
     const orderId = generateOrderNumber('ORD');

     // Create the order (payment pending)
     const order = await Order.create({
          orderId,
          userId,
          contestId: contest._id,
          contestName: contest.name,
          phone: user.phone || '',
          email: user.email || '',
          predictions: orderedPredictions,
          customPrediction: orderedCustomPredictions,
          totalAmount,
          status: 'pending',
     });

     return order;
};

const createCheckoutSession = async (orderId: string, userId: string) => {
     const order = await Order.findById(orderId)
          .populate('contestId', 'name category prize')
          .populate('userId', 'email');

     if (!order) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
     }

     if (order.userId._id.toString() !== userId) {
          throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized to access this order');
     }

     const user = await User.findById(userId);
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     try {
          // Collect all prediction IDs (both generated and custom)
          const allPredictionIds = [
               ...order.predictions.map((p) => p.predictionId),
               // Custom predictions don't have predictionId, so we handle separately
          ];

          // Create payment record
          const payment = await Payment.create({
               orderId: order.orderId,
               userId: order.userId._id,
               contestId: order.contestId._id,
               predictionIds: allPredictionIds,
               amount: order.totalAmount,
               currency: 'usd',
               paymentMethod: 'stripe',
               status: 'pending',
               metadata: {
                    paymentType: 'contest_order',
                    orderId: order.orderId,
                    contestName: order.contestName,
                    hasCustomPredictions: order.customPrediction && order.customPrediction.length > 0,
                    customPredictionsCount: order.customPrediction?.length || 0,
               },
               isDeleted: false,
          });

          // Create description
          const totalPredictions = order.predictions.length + (order.customPrediction?.length || 0);
          const description = `${order.predictions.length} Generated + ${order.customPrediction?.length || 0} Custom Prediction(s) | Order: ${order.orderId}`;

          // Create Stripe line items
          const lineItems = [
               {
                    price_data: {
                         currency: 'usd',
                         product_data: {
                              name: `Contest Entry - ${order.contestName}`,
                              description: description,
                         },
                         unit_amount: Math.round(order.totalAmount * 100),
                    },
                    quantity: 1,
               },
          ];

          // Create Stripe session
          const session = await stripe.checkout.sessions.create({
               payment_method_types: ['card'],
               line_items: lineItems,
               mode: 'payment',
               success_url: `${config.stripe.paymentSuccess_url}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
               cancel_url: `${config.stripe.paymentCancel_url}/orders/cancel`,
               customer_email: user.email,
               metadata: {
                    orderId: order._id.toString(),
                    userId: userId,
                    paymentId: (payment as any)._id.toString(),
                    contestId: order.contestId.toString(),
                    type: 'contest_order',
               },
          });

          // Update payment with session ID
          await Payment.findByIdAndUpdate(payment._id, {
               paymentSessionId: session.id,
          });

          // Update order with payment ID
          await Order.findByIdAndUpdate(order._id, {
               paymentId: payment._id,
          });

          return {
               sessionId: session.id,
               url: session.url,
               orderDetails: {
                    orderId: order.orderId,
                    totalAmount: order.totalAmount,
                    generatedPredictionsCount: order.predictions.length,
                    customPredictionsCount: order.customPrediction?.length || 0,
                    totalPredictions: totalPredictions,
               },
          };
     } catch (error: any) {
          console.error('Error creating checkout session:', error);
          throw new AppError(
               StatusCodes.INTERNAL_SERVER_ERROR,
               `Failed to create checkout session: ${error.message}`
          );
     }
};

const createOrderAndCheckout = async (
     userId: string,
     payload: IOrderPayload
) => {
     // Create order
     const order = await createContestOrder(userId, payload);

     // Create checkout session
     return createCheckoutSession(order._id.toString(), userId);
};
const getAllPredictionOrders = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(Order.find({ isDeleted: false }), query);
     const result = await queryBuilder
          .filter()
          .sort()
          .paginate()
          .fields()
          .search(['orderId'])
          .dateFilter('createdAt')
          .modelQuery.populate('userId', 'userName')
          .populate('products.productId', 'name sku')
          .exec();
     const meta = await queryBuilder.countTotal();
     return {
          meta,
          result,
     };
};


// const updateProductOrder = async (id: string, payload: Partial<IProductOrder>): Promise<IProductOrder | null> => {
//      const order = await Order.findById(id);

//      if (!order) {
//           throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
//      }

//      // If status is being updated to 'completed', update product stock
//      if (payload.status === 'shipping' && order.status !== 'delivered') {
//           // Update product stock
//           for (const item of order.products) {
//                await Inventory.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
//           }
//      }

//      const result = await ProductOrder.findByIdAndUpdate(id, payload, {
//           new: true,
//           runValidators: true,
//      });

//      return result;
// };

// const cancelProductOrder = async (id: string): Promise<IProductOrder | null> => {
//      const order = await ProductOrder.findById(id);

//      if (!order) {
//           throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
//      }

//      // Soft delete
//      const result = await ProductOrder.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

//      return result;
// };

// const createCheckoutSession = async (orderId: string, userId: string) => {
//      // Find the order
//      const order = await ProductOrder.findOne({ orderId }).populate('products.productId', 'name images');

//      if (!order) {
//           throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
//      }

//      if (order.userId.toString() !== userId) {
//           throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized to access this order');
//      }

//      // Get user email
//      const user = await User.findById(userId);
//      if (!user) {
//           throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
//      }

//      try {
//           // Create a payment record
//           const payment = await Payment.create({
//                orderId: order.orderId,
//                userId: order.userId,
//                productIds: order.products.map((item) => item.productId),
//                amount: order.totalAmount,
//                currency: 'usd',
//                paymentMethod: 'stripe',
//                status: 'pending',
//                metadata: {
//                     type: 'product_order',
//                     orderId: order.orderId,
//                },
//                isDeleted: false,
//           });

//           // Create line items for Stripe checkout
//           const lineItems = order.products.map((item) => {
//                const product = item.productId as any; // Type assertion for populated field
//                return {
//                     price_data: {
//                          currency: 'usd',
//                          product_data: {
//                               name: product.name,
//                               description: `SKU: ${product.sku || 'N/A'}`,
//                               images: product.images || [],
//                          },
//                          unit_amount: Math.round(item.price * 100), // Convert to cents
//                     },
//                     quantity: item.quantity,
//                };
//           });

//           // Create Stripe checkout session
//           const session = await stripe.checkout.sessions.create({
//                payment_method_types: ['card'],
//                line_items: lineItems,
//                mode: 'payment',
//                success_url: `${config.stripe.paymentSuccess_url}/api/v1/product-orders/success?session_id={CHECKOUT_SESSION_ID}`,
//                cancel_url: `${config.stripe.paymentCancel_url}/product-orders/cancel`,
//                metadata: {
//                     orderId: order.orderId,
//                     userId: userId,
//                     paymentId: payment._id.toString(),
//                     type: 'product_order',
//                },
//           });

//           // Update payment with session ID
//           await Payment.findByIdAndUpdate(payment._id, { paymentSessionId: session.id });

//           // Update order with payment ID
//           await ProductOrder.findByIdAndUpdate(order._id, { paymentId: payment._id });

//           return {
//                sessionId: session.id,
//                url: session.url,
//           };
//      } catch (error: any) {
//           console.error('Error creating checkout session:', error);
//           throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create checkout session: ${error.message}`);
//      }
// };

// const handleSuccessfulPayment = async (sessionId: string) => {
//      try {
//           // Retrieve the session
//           const session = await stripe.checkout.sessions.retrieve(sessionId);

//           if (!session) {
//                throw new AppError(StatusCodes.NOT_FOUND, 'Checkout session not found');
//           }

//           // Find the payment by session ID
//           const payment = await Payment.findOne({ paymentSessionId: sessionId });
//           if (payment?.userId) {
//                await trackPurchase(payment.userId.toString());
//           }
//           if (!payment) {
//                throw new AppError(StatusCodes.NOT_FOUND, 'Payment record not found');
//           }

//           // Update payment status
//           await Payment.findByIdAndUpdate(
//                payment._id,
//                {
//                     status: 'completed',
//                     paidAt: new Date(),
//                     paymentIntentId: session.payment_intent as string,
//                },
//                { new: true },
//           );

//           // Update order status
//           const order = await ProductOrder.findOne({ orderId: payment.orderId });

//           if (order) {
//                await ProductOrder.findByIdAndUpdate(order._id, { status: 'processing' }, { new: true });

//                // Update product stock
//                for (const item of order.products) {
//                     await Inventory.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
//                }
//           }

//           return session;
//      } catch (error: any) {
//           console.error('Error handling successful payment:', error);
//           throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to process successful payment: ${error.message}`);
//      }
// };

const getUserOrders = async (userId: string, query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(Order.find({ userId }), query).filter().sort().paginate().fields().dateFilter('createdAt').search(['contestName', 'orderId']);
     const result = await queryBuilder.modelQuery.populate('contestId', "name image endTime startTime totalEntries endOffsetTime prize").exec();
     const meta = await queryBuilder.countTotal();
     return {
          meta,
          result,
     };
};

const getSinglePredictionOrder = async (id: string): Promise<IProductOrder | null> => {
     const result = await Order.findById(id).populate('userId', 'name email').populate('contestId', "name image endTime startTime totalEntries endOffsetTime prize").exec();

     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
     }
     return result;
};


const analysisOrders = async (userId: string) => {
     try {
          const result = await Order.aggregate([
               {
                    $match: {
                         userId: new Types.ObjectId(userId),
                         isDeleted: false,
                    },
               },
               {
                    $lookup: {
                         from: 'contests',
                         localField: 'contestId',
                         foreignField: '_id',
                         as: 'contest',
                    },
               },
               {
                    $unwind: {
                         path: '$contest',
                         preserveNullAndEmptyArrays: true,
                    },
               },
               {
                    $group: {
                         _id: null,
                         totalContests: { $addToSet: '$contestId' },
                         totalEntries: { $sum: { $size: '$predictions' } },
                         totalSpend: { $sum: '$totalAmount' },
                         totalPrizePool: { $sum: { $ifNull: ['$contest.prize.prizePool', 0] } },
                    },
               },
               {
                    $project: {
                         _id: 0,
                         totalContests: { $size: '$totalContests' },
                         totalSpend: 1,
                         totalEntries: 1,
                         totalRevenue: '$totalPrizePool',
                    },
               },
          ]);

          return result[0] || {
               totalContests: 0,
               totalEntries: 0,
               totalRevenue: 0,
          };
     } catch (error: any) {
          console.error('Error analyzing orders:', error);
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to analyze orders: ${error.message}`);
     }
};

const pastAnalysisOrders = async (userId: string) => {
     try {
          const result = await Order.aggregate([
               {
                    $match: {
                         userId: new Types.ObjectId(userId),
                         isDeleted: false,
                         status: { $ne: ['pending', 'processing', 'cancelled', 'shipping'] },
                    },
               },
               {
                    $lookup: {
                         from: 'contests',
                         localField: 'contestId',
                         foreignField: '_id',
                         as: 'contest',
                    },
               },
               {
                    $unwind: {
                         path: '$contest',
                         preserveNullAndEmptyArrays: true,
                    },
               },
               {
                    $group: {
                         _id: null,
                         totalContests: { $addToSet: '$contestId' },
                         totalEntries: { $sum: { $size: '$predictions' } },
                         totalSpend: { $sum: '$totalAmount' },
                         totalPrizePool: { $sum: { $ifNull: ['$contest.prize.prizePool', 0] } },
                    },
               },
               {
                    $project: {
                         _id: 0,
                         totalContests: { $size: '$totalContests' },
                         totalSpend: 1,
                         totalEntries: 1,
                         totalRevenue: '$totalPrizePool',
                    },
               },
          ]);

          return result[0] || {
               totalContests: 0,
               totalEntries: 0,
               totalRevenue: 0,
          };
     } catch (error: any) {
          console.error('Error analyzing orders:', error);
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to analyze orders: ${error.message}`);
     }
};

export default analysisOrders;
export const OrderService = {
     // createProductOrder,
     getAllPredictionOrders,
     getSinglePredictionOrder,
     // updateProductOrder,
     // cancelProductOrder,
     pastAnalysisOrders,
     analysisOrders,
     createCheckoutSession,
     getUserOrders,
     createOrderAndCheckout,
};
