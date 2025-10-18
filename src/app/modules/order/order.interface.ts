import { Types } from "mongoose";
import { US_STATES } from "../contest/contest.interface";
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
     state: US_STATES;
     endTime: Date;
     status: 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled' | 'won' | 'lost';
     paymentId?: Types.ObjectId;
     isDeleted: boolean;
     createdAt: Date;
     updatedAt: Date;
}