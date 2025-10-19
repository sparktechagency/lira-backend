import { Types } from "mongoose";

export interface Help {
    userId: Types.ObjectId;
    email: string;
    reply: string;
    message: string;
    status: 'pending' | 'resolved';
}
