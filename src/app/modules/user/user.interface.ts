import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';
export type IUser = {
     name: string;
     role: USER_ROLES;
     email: string;
     password?: string;
     image?: string;
     isDeleted: boolean;
     stripeCustomerId: string;
     status: 'active' | 'blocked';
     verified: boolean;
     googleId?: string;
     facebookId?: string;
     oauthProvider?: 'google' | 'facebook';
     agreeWithTerms?: boolean;
     phone?: string;
     state: string;
     address?: string;
     // 💳 NEW: Saved Cards for Withdrawal
     savedCards?: {
          cardId: string;
          last4: string;
          brand: string;
          expiryMonth: number;
          expiryYear: number;
          country: string;
          funding: string; // debit, credit, prepaid
          isDefault: boolean;
          addedAt: Date;
     }[];
     // 💰 Wallet & Transaction History
     wallet?: {
          balance: number;
          currency: string;
          totalEarned: number;
          totalWithdrawn: number;
     };
     authentication?: {
          isResetPassword: boolean;
          oneTimeCode: number;
          expireAt: Date;
     };
     // ✅ Online Status Interface
     onlineStatus?: {
          isOnline?: boolean;
          lastSeen?: Date;
          lastHeartbeat?: Date;
     };
     // Referral System
     referralCode?: string;
     referredBy?: string;
     referralCount?: number;
     points?: number;
};

export type UserModel = {
     isExistUserById(id: string): any;
     isExistUserByEmail(email: string): any;
     isExistUserByPhone(contact: string): any;
     isMatchPassword(password: string, hashPassword: string): boolean;
     // ✅ Online Status Methods
     setUserOnline(userId: string): Promise<void>;
     setUserOffline(userId: string): Promise<void>;
     updateHeartbeat(userId: string): Promise<void>;
     getOnlineUsers(): Promise<IUser[]>;
     bulkUserStatus(userIds: string[]): Promise<IUser[]>;
} & Model<IUser>;
