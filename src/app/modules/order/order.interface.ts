import { Types } from "mongoose";

// order.interface.ts
export interface IProductOrder extends Document {
     orderId: string;
     userId: Types.ObjectId;
     contestId: Types.ObjectId;
     contestName: string;
     predictions: Array<{
          predictionId: Types.ObjectId; // Reference to generated prediction's _id
          predictionValue: number;
          tierId: string;
          price: number;
     }>;
     customPrediction: Array<{
          predictionValue: number;
          tierId: string;
          price: number;
     }>;
     phone: string;
     email: string;
     totalAmount: number;
     status: 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled' | 'won' | 'lost';
     paymentId?: Types.ObjectId;
     isDeleted: boolean;
     createdAt: Date;
     updatedAt: Date;
}