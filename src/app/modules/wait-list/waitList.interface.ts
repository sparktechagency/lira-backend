import { Types } from "mongoose";


export interface IWaitList extends Document {
    userId: Types.ObjectId;
    contestId: Types.ObjectId;
}