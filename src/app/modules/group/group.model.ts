import { model, Schema } from 'mongoose';
import { GroupModel, IGroup } from './group.interface';


const groupSchema = new Schema<IGroup, GroupModel>(
     {
          serial:{
               type: Number,
               required: true,
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

export const Group = model<IGroup, GroupModel>('Group', groupSchema);
