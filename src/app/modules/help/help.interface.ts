import { Types } from "mongoose";

export interface Help {
    userId: Types.ObjectId;
    title: string;
    description: string;
    status: 'pending' | 'resolved';
}
