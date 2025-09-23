import { Model } from 'mongoose';

export type IUnitType = {
     content: string;
     type: 'type' | 'unit';
};

export type UnitTypeModel = Model<IUnitType, Record<string, unknown>>;
