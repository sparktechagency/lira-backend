import { Model, Types } from 'mongoose';

export interface IReaction {
  userId: Types.ObjectId;
  reactionType: 'like' | 'love' | 'thumbs_up' | 'laugh' | 'angry' | 'sad';
  timestamp: Date;
}

export type IMessage = {
  chatId: Types.ObjectId;
  sender: Types.ObjectId;
  text?: string;
  images?: string[];
  reactions: IReaction[];
  read: boolean;
  isDeleted: boolean;
  type: 'text' | 'image' | 'doc' | 'both';
  // New field for pinned messages
  isPinned: boolean;
  pinnedBy?: Types.ObjectId;
  pinnedAt?: Date;
};

export type MessageModel = Model<IMessage, Record<string, unknown>>;
