import { model, Schema } from 'mongoose';
import { IPayment } from './payments.interface';

const paymentSchema = new Schema<IPayment>(
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
               index: true,
          },
          productIds: [
               {
                    type: Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
               },
          ],
          amount: {
               type: Number,
               required: true,
          },
          currency: {
               type: String,
               required: true,
               default: 'usd',
          },
          paymentMethod: {
               type: String,
               enum: ['stripe', 'paypal', 'other'],
               required: true,
          },
          paymentIntentId: {
               type: String,
               required: false,
          },
          paymentSessionId: {
               type: String,
               required: false,
          },
          status: {
               type: String,
               enum: ['pending', 'paid', 'failed', 'refunded'],
               default: 'pending',
          },
          metadata: {
               type: Object,
               required: false,
          },
          refundAmount: {
               type: Number,
               required: false,
          },
          refundReason: {
               type: String,
               required: false,
          },
          refundedAt: {
               type: Date,
               required: false,
          },
          paidAt: {
               type: Date,
               required: false,
          },
          isDeleted: {
               type: Boolean,
               default: false,
          },
     },
     {
          timestamps: true,
     },
);

// Query Middleware
paymentSchema.pre('find', function (next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

paymentSchema.pre('findOne', function (next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

paymentSchema.pre('aggregate', function (next) {
     this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
     next();
});

export const Payment = model<IPayment>('Payment', paymentSchema);
