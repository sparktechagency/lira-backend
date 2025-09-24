import { model, Schema } from 'mongoose';
import { IUnitType, UnitTypeModel } from './unit-type.interface';

const unitTypeSchema = new Schema<IUnitType, UnitTypeModel>({
     content: {
          type: String,
          required: true,
     },
     type: {
          type: String,  
          enum: ['type', 'unit'],
          select: 0,
     },
});

export const UnitType = model<IUnitType, UnitTypeModel>('UnitType', unitTypeSchema);
