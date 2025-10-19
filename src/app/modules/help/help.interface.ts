import { Types } from "mongoose";

export interface Help {
    userId: Types.ObjectId;
    email: string;
    reply: string;
    description: string;
    status: 'pending' | 'resolved';
}
