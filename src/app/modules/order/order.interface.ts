import { Types } from 'mongoose';

export interface IProductOrder {
     orderId: string;
     userId: Types.ObjectId;
     promoCodeId?: Types.ObjectId;
     products: {
          productId: Types.ObjectId;
          quantity: number;
          price: number;
          creditEarn: number;
          csAuraEarn: number;
     }[];
     phone: string;
     email: string;
     totalAmount: number;
     finalAmount: number;
     status: 'pending' | 'processing' | 'shipping' | 'delivered';
     shippingAddress?: {
          address: string;
     };
     promoCode?: string;
     deliveryType: string;
     deliveryFee?: string;
     deliveryDate?: Date;
     deliveryTime?: string;
     discount?: number;
     offer?: string;
     previousOrderId: string;
     comments: string;
     paymentId?: Types.ObjectId;
     createdAt?: Date;
     updatedAt?: Date;
     isDeleted: boolean;
}

export interface IProductOrderFilters {
     searchTerm?: string;
     userId?: Types.ObjectId;
     status?: string;
     startDate?: Date;
     endDate?: Date;
}
