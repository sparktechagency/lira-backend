import { Types } from 'mongoose';

export interface IPayment {
     orderId: string;
     userId: Types.ObjectId;
     productIds: Types.ObjectId[];
     amount: number;
     currency: string;
     paymentMethod: 'stripe' | 'paypal' | 'other';
     paymentIntentId?: string;
     paymentSessionId?: string;
     status: 'pending' | 'paid' | 'failed' | 'refunded';
     metadata?: Record<string, any>;
     refundAmount?: number;
     refundReason?: string;
     refundedAt?: Date;
     paidAt?: Date;
     isDeleted: boolean;
}

export interface IPaymentFilters {
     searchTerm?: string;
     userId?: Types.ObjectId;
     status?: string;
     startDate?: Date;
     endDate?: Date;
}
