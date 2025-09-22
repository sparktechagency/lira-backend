import { Types } from 'mongoose';

export interface IBookmark extends Document {
     userId: Types.ObjectId;
     referenceId: Types.ObjectId;
     referenceType: string; // Can be 'video', 'article', etc.
     isBookmarked: boolean;
     createdAt: Date;
     updatedAt: Date;
}
