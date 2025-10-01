import { Schema, model } from 'mongoose';
import { IProductOrder } from './order.interface';

const productOrderSchema = new Schema<IProductOrder>(
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
          predictionIds: [
               {
                    predictionId: {
                         type: Schema.Types.ObjectId,
                         ref: 'Prediction',
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
productOrderSchema.pre('find', function (this: any, next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

productOrderSchema.pre('findOne', function (this: any, next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

productOrderSchema.pre('aggregate', function (this: any, next) {
     this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
     next();
});

export const ProductOrder = model<IProductOrder>('ProductOrder', productOrderSchema);
