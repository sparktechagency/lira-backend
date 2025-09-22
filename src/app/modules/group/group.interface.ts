import { Model } from 'mongoose';

export type IGroup = {
     serial: number;
     name: string;
};

export type GroupModel = Model<IGroup, Record<string, unknown>>;
