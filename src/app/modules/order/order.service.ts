import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IProductOrder } from './order.interface';
import { ProductOrder } from './order.model';
import { Payment } from '../payments/payments.model';
import stripe from '../../../config/stripe';
import config from '../../../config';

import { User } from '../user/user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import generateOrderNumber from '../../../utils/generateOrderNumber';


const createProductOrder = async (userId: string, payload: Partial<IProductOrder>) => {
     // Generate a unique order ID
     const orderId = generateOrderNumber('ORD');
     const { promoCodeId, promoCode = '', finalAmount, deliveryType = '', comments = '', deliveryFee = 0, deliveryDate, discount = 0, previousOrderId = '', paymentId, shippingAddress = '' } = payload;
     // Validate products and calculate total amount
     const isExisting = await User.findById(userId);
     if (!isExisting) {
          throw new AppError(StatusCodes.NOT_FOUND, 'This user not found!');
     }

     const products = [];
     let totalAmount: number = 0;
     for (const item of payload.products || []) {
          const product = await Inventory.findById(item.productId);
          if (!product) {
               throw new AppError(StatusCodes.NOT_FOUND, `Product with ID ${item.productId} not found`);
          }

          if (product.isStock === false) {
               throw new AppError(StatusCodes.BAD_REQUEST, `Product ${product.name} is out of stock`);
          }

          if (product.stock <= item.quantity) {
               throw new AppError(StatusCodes.BAD_REQUEST, `Not enough stock for product ${product.name}. Available: ${product.stock}`);
          }

          // Add product to order with validated price
          products.push({
               productId: product._id,
               quantity: item.quantity,
               price: product.price,
               creditEarn: product.creditEarn,
               csAuraEarn: product.csAuraEarn,
          });

          // Calculate total amount
          totalAmount += product.price * item.quantity;
     }
     // Calculate final amount (total - discount + delivery fee)
     // const finalAmount = Number(totalAmount) - Number(discount) + Number(deliveryFee);
     // Create the order
     const order = await ProductOrder.create({
          orderId,
          userId,
          promoCodeId,
          promoCode,
          phone: isExisting.contact,
          email: isExisting.email,
          products,
          finalAmount,
          totalAmount,
          deliveryType,
          comments,
          deliveryFee,
          deliveryDate,
          discount,
          previousOrderId,
          paymentId,
          shippingAddress: isExisting?.address || shippingAddress,
     });

     return order;
};

const getAllProductOrders = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(ProductOrder.find({ isDeleted: false }), query);
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

const getSingleProductOrder = async (id: string): Promise<IProductOrder | null> => {
     const result = await ProductOrder.findById(id).populate('userId', 'name email').populate('products.productId', 'name sku images').populate('paymentId');

     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
     }

     return result;
};

const updateProductOrder = async (id: string, payload: Partial<IProductOrder>): Promise<IProductOrder | null> => {
     const order = await ProductOrder.findById(id);

     if (!order) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
     }

     // If status is being updated to 'completed', update product stock
     if (payload.status === 'shipping' && order.status !== 'delivered') {
          // Update product stock
          for (const item of order.products) {
               await Inventory.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
          }
     }

     const result = await ProductOrder.findByIdAndUpdate(id, payload, {
          new: true,
          runValidators: true,
     });

     return result;
};

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
const createCheckoutSession = async (orderId: string, userId: string) => {
     // Find the order
     const order = await ProductOrder.findOne({ orderId }).populate('products.productId', 'name images sku');

     if (!order) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
     }

     if (order.userId.toString() !== userId) {
          throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized to access this order');
     }

     // Get user email
     const user = await User.findById(userId);
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     // Helper function to validate and filter URLs
     // const validateImageUrls = (images: string[] | undefined): string[] => {
     //      if (!images || !Array.isArray(images)) {
     //           return [];
     //      }

     //      return images
     //           .filter((url) => {
     //                if (!url || typeof url !== 'string') return false;

     //                try {
     //                     // Check if it's a valid URL
     //                     new URL(url);
     //                     // Check if it starts with http or https
     //                     return url.startsWith('http://') || url.startsWith('https://');
     //                } catch {
     //                     return false;
     //                }
     //           })
     //           .slice(0, 8); // Stripe allows max 8 images
     // };

     try {
          // Create a payment record
          const payment = await Payment.create({
               orderId: order.orderId,
               userId: order.userId,
               productIds: order.products.map((item) => item.productId),
               amount: order.finalAmount,
               currency: 'aed',
               paymentMethod: 'stripe',
               status: 'pending',
               metadata: {
                    type: 'product_order',
                    orderId: order.orderId,
                    promoCode: order.promoCode,
               },
               isDeleted: false,
          });

          const lineItems = [
               {
                    price_data: {
                         currency: 'aed',
                         product_data: {
                              name: `${order.orderId}`,
                         },
                         unit_amount: Math.round(order.finalAmount * 100),
                    },
                    quantity: 1,
               },
          ];

          // Create Stripe checkout session
          const session = await stripe.checkout.sessions.create({
               payment_method_types: ['card'],
               line_items: lineItems,
               mode: 'payment',
               success_url: `${config.stripe.paymentSuccess_url}/api/v1/product-orders/success?session_id={CHECKOUT_SESSION_ID}`,
               cancel_url: `${config.stripe.paymentCancel_url}/product-orders/cancel`,
               customer_email: user.email, // Add customer email if available
               metadata: {
                    orderId: order._id.toString(),
                    userId: userId,
                    paymentId: payment._id.toString(),
                    type: 'product_order',
               },
          });

          // Update payment with session ID
          await Payment.findByIdAndUpdate(payment._id, { paymentSessionId: session.id });

          // Update order with payment ID
          await ProductOrder.findByIdAndUpdate(order._id, { paymentId: payment._id });

          return {
               sessionId: session.id,
               url: session.url,
          };
     } catch (error: any) {
          console.error('Error creating checkout session:', error);
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create checkout session: ${error.message}`);
     }
};
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
     const queryBuilder = new QueryBuilder(ProductOrder.find({ userId }), query).filter().sort().paginate().fields().dateFilter('createdAt');

     const result = await queryBuilder.modelQuery.populate('products.productId', 'name sku images').populate('paymentId').exec();

     const meta = await queryBuilder.countTotal();

     return {
          meta,
          result,
     };
};

const createOrderAndCheckout = async (userId: string, payload: Partial<IProductOrder>): Promise<{ sessionId: string; url: string | null }> => {
     // First create the order
     const order = await createProductOrder(userId, payload);
     // Then create the checkout session
     return createCheckoutSession(order.orderId, userId);
};
const analysisOrders = async () => {
     try {
          // Method 1: Using aggregation pipeline (more efficient for large datasets)
          const orderAnalysis = await ProductOrder.aggregate([
               {
                    $match: {
                         isDeleted: { $ne: true }, // Only count non-deleted orders
                    },
               },
               {
                    $group: {
                         _id: '$status',
                         count: { $sum: 1 },
                    },
               },
               {
                    $group: {
                         _id: null,
                         orders: {
                              $push: {
                                   status: '$_id',
                                   count: '$count',
                              },
                         },
                         totalOrders: { $sum: '$count' },
                    },
               },
          ]);

          // Transform the result into a more readable format
          const result = {
               pending: 0,
               processing: 0,
               shipping: 0,
               delivered: 0,
               cancel: 0,
               totalOrders: 0,
          };

          if (orderAnalysis.length > 0) {
               result.totalOrders = orderAnalysis[0].totalOrders;

               orderAnalysis[0].orders.forEach((order: any) => {
                    result[order.status as keyof typeof result] = order.count;
               });
          }

          return result;
     } catch (error) {
          console.error('Error analyzing orders:', error);
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to analyze orders');
     }
};
export const ProductOrderService = {
     createProductOrder,
     getAllProductOrders,
     getSingleProductOrder,
     updateProductOrder,
     // cancelProductOrder,
     analysisOrders,
     createCheckoutSession,
     getUserOrders,
     createOrderAndCheckout,
};
