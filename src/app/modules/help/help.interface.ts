import { Types } from "mongoose";

export interface Help {
    userId: Types.ObjectId;
    email: string;
    description: string;
    status: 'pending' | 'resolved';
}
