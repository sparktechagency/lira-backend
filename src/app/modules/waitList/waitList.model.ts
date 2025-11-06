import { Schema, model } from "mongoose";
import { IWaitList } from "./waitList.interface";


const WaitListSchema = new Schema<IWaitList>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contestId: { type: Schema.Types.ObjectId, ref: 'Contest', required: true },
}, {
    timestamps: true,
});

export const WaitListModel = model<IWaitList>('WaitList', WaitListSchema);
