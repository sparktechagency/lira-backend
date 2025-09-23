import { Model, Schema } from 'mongoose';

export type ICategory = {
     serial: number;
     name: string;
     url: string;
     groupId: Schema.Types.ObjectId;
     group: string;
};

export type CategoryModel = Model<ICategory, Record<string, unknown>>;
