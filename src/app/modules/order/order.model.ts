import { Schema, model } from 'mongoose';
import { IProductOrder } from './order.interface';
import { US_STATES_ARRAY } from '../contest/contest.model';


const orderSchema = new Schema<IProductOrder>(
     {
          orderId: {
               type: String,
               required: true,
               unique: true,
          },
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
          },
          // Added for contest orders
          contestId: {
               type: Schema.Types.ObjectId,
               ref: 'Contest',
               required: true,
          },
          contestName: {
               type: String,
               required: true,
          },
          predictions: [
               {
                    predictionId: {
                         type: Schema.Types.ObjectId,
                         ref: 'Prediction',
                         required: true,
                    },
                    predictionValue: {
                         type: Number,
                         required: true,
                    },
                    tierId: {
                         type: Schema.Types.ObjectId,
                         ref: 'Tier',
                         required: true,
                    },
                    price: {
                         type: Number,
                         required: true,
                    },
               },
          ],
          customPrediction: [
               {
                    predictionValue: {
                         type: Number,
                         required: false,
                         default: 0
                    },
                    tierId: {
                         type: Schema.Types.ObjectId,
                         ref: 'Tier',
                         required: false,
                         default: null
                    },
                    price: {
                         type: Number,
                         required: false,
                         default: 0
                    },
               },
          ],
          phone: {
               type: String,
               default: '',
          },
          email: {
               type: String,
               default: '',
          },
          totalAmount: {
               type: Number,
               required: true,
          },
          state: {
               type: String,
               enum: US_STATES_ARRAY as unknown as string[],
          },
          endTime: {
               type: Date,
               default: Date.now,
          },
          status: {
               type: String,
               enum: ['pending', 'processing', 'shipping', 'delivered', 'complete', 'cancelled', 'won', 'lost'],
               default: 'pending',
          },
          paymentId: {
               type: Schema.Types.ObjectId,
               ref: 'Payment',
          },
          isDeleted: {
               type: Boolean,
               default: false,
          },
          result: {
               place: {
                    type: Number,
                    default: null
               },
               predictionValue: {
                    type: Number,
                    default: 0
               },
               actualValue: {
                    type: Number,
                    default: 0
               },
               difference: {
                    type: Number,
                    default: 0
               },
               prizeAmount: {
                    type: Number,
                    default: 0
               },
               percentage: {
                    type: Number,
                    default: 0
               },
          },
     },
     {
          timestamps: true,
          toJSON: {
               virtuals: true,
          },
     },
);

// Query middleware to exclude deleted documents
orderSchema.pre('find', function (this: any, next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

orderSchema.pre('findOne', function (this: any, next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

orderSchema.pre('aggregate', function (this: any, next) {
     this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
     next();
});

export const Order = model<IProductOrder>('Order', orderSchema);
