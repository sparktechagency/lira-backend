import { Model } from 'mongoose';

export type IUnitType = {
     content: string;
     key: 'type' | 'unit';
};

export type UnitTypeModel = Model<IUnitType, Record<string, unknown>>;
