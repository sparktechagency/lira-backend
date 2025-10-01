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
          promoCodeId: {
               type: Schema.Types.ObjectId,
               ref: 'PromoCode',
               default: null,
          },
          products: [
               {
                    productId: {
                         type: Schema.Types.ObjectId,
                         ref: 'Inventory',
                         required: true,
                    },
                    quantity: {
                         type: Number,
                         required: true,
                         min: 1,
                    },
                    price: {
                         type: Number,
                         required: true,
                    },
                    creditEarn: {
                         type: Number,
                         default: 0,
                    },
                    csAuraEarn: {
                         type: Number,
                         default: 0,
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
          finalAmount: {
               type: Number,
               required: true,
          },
          deliveryType: {
               type: String,
               default: '',
          },
          comments: {
               type: String,
               default: '',
          },
          deliveryFee: {
               type: Number,
               default: 0,
          },
          deliveryDate: {
               type: Date,
               default: '',
          },
          deliveryTime: {
               type: String,
               default: '',
          },
          discount: {
               type: Number,
               default: 0,
          },
          offer: {
               type: String,
               default: function () {
                    return (this as any).discount > 0 ? 'Yes' : 'No';
               },
          },

          status: {
               type: String,
               enum: ['pending', 'processing', 'shipping', 'delivered', 'cancel'],
               default: 'pending',
          },
          shippingAddress: {
               type: String,
               default: '',
          },
          previousOrderId: {
               type: String,
               default: '',
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
