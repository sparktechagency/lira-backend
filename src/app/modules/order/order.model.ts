import { Schema, model } from 'mongoose';
import { IProductOrder } from './order.interface';

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

          status: {
               type: String,
               enum: ['pending', 'processing', 'shipping', 'delivered', 'cancel'],
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
