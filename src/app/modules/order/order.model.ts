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
          contestId: {
               type: Schema.Types.ObjectId,
               ref: 'Contest',
               required: true,
          },
          category: {
               type: String,
               required: true,
          },
          categoryId: {
               type: Schema.Types.ObjectId,
               ref: 'Category',
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
                    // 🆕 ADD THIS - Individual prediction timestamp
                    createdAt: {
                         type: Date,
                         default: Date.now,
                    },
               },
          ],
          customPrediction: [
               {
                    predictionValue: {
                         type: Number,
                         required: false,
                         default: 0,
                    },
                    tierId: {
                         type: Schema.Types.ObjectId,
                         ref: 'Tier',
                         required: false,
                         default: null,
                    },
                    price: {
                         type: Number,
                         required: false,
                         default: 0,
                    },
                    createdAt: {
                         type: Date,
                         default: Date.now, // ✅ Already exists - perfect!
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
                    default: null,
               },
               predictionValue: {
                    type: Number,
                    default: 0,
               },
               actualValue: {
                    type: Number,
                    default: 0,
               },
               difference: {
                    type: Number,
                    default: 0,
               },
               prizeAmount: {
                    type: Number,
                    default: 0,
               },
               percentage: {
                    type: Number,
                    default: 0,
               },
               // 🆕 ADD THIS - Prediction timestamp for tiebreaker reference
               predictionTime: {
                    type: Date,
                    default: null,
               },
          },
     },
     {
          timestamps: true, // ✅ Already exists - this adds createdAt & updatedAt
          toJSON: {
               virtuals: true,
          },
     },
);

// 🆕 ADD THIS - Index for tiebreaker sorting
orderSchema.index({ contestId: 1, createdAt: 1 }); // For efficient tiebreaker queries
orderSchema.index({ contestId: 1, status: 1 });

// 🆕 ADD THIS - Pre-save middleware for prediction timestamps
orderSchema.pre('save', function(next) {
     // Ensure all predictions have createdAt timestamps
     if (this.predictions && this.predictions.length > 0) {
          this.predictions.forEach((pred: any) => {
               if (!pred.createdAt) {
                    pred.createdAt = this.createdAt || new Date();
               }
          });
     }
     
     if (this.customPrediction && this.customPrediction.length > 0) {
          this.customPrediction.forEach((pred: any) => {
               if (!pred.createdAt) {
                    pred.createdAt = this.createdAt || new Date();
               }
          });
     }
     
     next();
});

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