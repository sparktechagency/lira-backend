// payments.interface.ts
import { Document, Model, Types } from 'mongoose';

export interface IPaymentMetadata {
    type?: 'product_order' | 'contest_order';
    orderId?: string;
    contestName?: string;
    promoCode?: string;
}

export interface IPayment extends Document {
    orderId: string;
    userId: Types.ObjectId;
    contestId?: Types.ObjectId; // For contest orders
    predictionIds?: Types.ObjectId[]; // Track which predictions were purchased
    amount: number;
    currency: string;
    paymentMethod: 'stripe' | 'paypal' | 'other';
    paymentIntentId?: string;
    paymentSessionId?: string;
    status: 'pending' | 'completed' | 'paid' | 'failed' | 'refunded' | 'cancelled';
    metadata?: IPaymentMetadata;
    refundAmount?: number;
    refundReason?: string;
    refundedAt?: Date;
    paidAt?: Date;
    completedAt?: Date;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;

    // Virtual
    paymentType: string;

    // Methods
    isSuccessful(): boolean;
    isPending(): boolean;
}

export interface IPaymentModel extends Model<IPayment> {
    getUserContestPayments(userId: string): Promise<IPayment[]>;
    getContestRevenue(contestId: string): Promise<any[]>;
}