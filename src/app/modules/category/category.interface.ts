import { Model } from 'mongoose';

export type ICategory = {
     serial: number;
     name: string;
};

export type CategoryModel = Model<ICategory, Record<string, unknown>>;
