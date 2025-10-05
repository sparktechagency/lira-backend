import { model, Schema } from "mongoose";
import { ICommunity, ICommunityVote } from "./community.interface";



const communitySchema = new Schema<ICommunity>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    upvote: {
        type: Number,
        default: 0,
    },
    downvote: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'decline', 'live'],
        default: 'pending',
    },
},
    {
        timestamps: true,
    });
const communityUpdateSchema = new Schema<ICommunityVote>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Community',
        required: true,
    },
    vote: {
        type: Boolean
    }
},
    {
        timestamps: true,
    });


export const CommunityVoteModel = model<ICommunityVote>('CommunityVote', communityUpdateSchema);
export const CommunityModel = model<ICommunity>('Community', communitySchema);
