import { Types } from "mongoose";


export interface IWithdrawal {
     user: Types.ObjectId;
     amount: number;
     pointsDeducted: number;
     currency: string;
     status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'failed';
     withdrawalMethod: 'card' | 'bank';
     cardDetails?: {
          cardId: string;
          last4: string;
          brand: string;
     };
     stripePayoutId?: string;
     stripeTransferId?: string;
     adminNote?: string;
     rejectionReason?: string;
     processedBy?: Types.ObjectId;
     processedAt?: Date;
     requestedAt: Date;
     completedAt?: Date;
     metadata?: {
          ipAddress?: string;
          userAgent?: string;
          deviceInfo?: string;
     };
}
