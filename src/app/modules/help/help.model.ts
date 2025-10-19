import { Schema, model } from "mongoose";
import { Help } from "./help.interface";

const HelpSchema = new Schema<Help>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    reply: { type: String, default: '' },
    description: { type: String, required: true },
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
});

export const HelpModel = model<Help>('Help', HelpSchema);