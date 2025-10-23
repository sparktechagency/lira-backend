import { model, Schema } from 'mongoose';
import { IWithdrawal } from './withdrawal.interface';

const withdrawalSchema = new Schema<IWithdrawal>(
     {
          user: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
               index: true,
          },
          amount: {
               type: Number,
               required: true,
               min: [10, 'Minimum withdrawal amount is $10'],
          },
          pointsDeducted: {
               type: Number,
               required: true,
          },
          currency: {
               type: String,
               default: 'USD',
               uppercase: true,
          },
          status: {
               type: String,
               enum: ['pending', 'approved', 'processing', 'completed', 'rejected', 'failed'],
               default: 'pending',
               index: true,
          },
          withdrawalMethod: {
               type: String,
               enum: ['card', 'bank'],
               required: true,
          },
          cardDetails: {
               cardId: String,
               last4: String,
               brand: String,
          },
          stripePayoutId: String,
          stripeTransferId: String,
          adminNote: String,
          rejectionReason: String,
          processedBy: {
               type: Schema.Types.ObjectId,
               ref: 'User',
          },
          processedAt: Date,
          requestedAt: {
               type: Date,
               default: Date.now,
          },
          completedAt: Date,
          metadata: {
               ipAddress: String,
               userAgent: String,
               deviceInfo: String,
          },
     },
     { timestamps: true },
);

// Indexes for better query performance
withdrawalSchema.index({ user: 1, status: 1 });
withdrawalSchema.index({ createdAt: -1 });
withdrawalSchema.index({ status: 1, requestedAt: -1 });

// Virtual for time elapsed
withdrawalSchema.virtual('timeElapsed').get(function () {
     if (this.completedAt) {
          return this.completedAt.getTime() - this.requestedAt.getTime();
     }
     return Date.now() - this.requestedAt.getTime();
});

export const Withdrawal = model<IWithdrawal>('Withdrawal', withdrawalSchema);