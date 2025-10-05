import { Types } from "mongoose";

export interface ICommunity {
    userId: Types.ObjectId;
    title: string;
    description: string;
    upvote: number;
    downvote: number;
    status: 'pending' | 'decline' | 'live';
}

export interface ICommunityVote {
    userId: Types.ObjectId;
    postId: Types.ObjectId;
    vote: boolean;
}
