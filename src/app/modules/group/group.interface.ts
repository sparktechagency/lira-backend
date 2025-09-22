import { Model } from 'mongoose';

export type IGroup = {
     name: string;
     image: string;
};

export type GroupModel = Model<IGroup, Record<string, unknown>>;
