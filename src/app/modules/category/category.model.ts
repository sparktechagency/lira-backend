import { model, Schema } from 'mongoose';
import { ICategory, CategoryModel } from './category.interface';

const serviceSchema = new Schema<ICategory, CategoryModel>(
     {
          serial: {
               type: Number,
               required: false,
               default: 1,
          },
          name: {
               type: String,
               required: true,
               unique: true,
          },
          image: {
               type: String,
               required: true,
          },
     },
     { timestamps: true },
);

export const Category = model<ICategory, CategoryModel>('Category', serviceSchema);
