import { Types } from 'mongoose';

export interface IProductOrder {
     orderId: string;
     userId: Types.ObjectId;
     predictionIds: {
          predictionId: Types.ObjectId;
     }[];
     phone: string;
     email: string;
     totalAmount: number;
     status: 'pending' | 'processing' | 'shipping' | 'delivered';
     paymentId?: Types.ObjectId;
     isDeleted: boolean;
}

export interface IProductOrderFilters {
     searchTerm?: string;
     userId?: Types.ObjectId;
     status?: string;
     startDate?: Date;
     endDate?: Date;
}
