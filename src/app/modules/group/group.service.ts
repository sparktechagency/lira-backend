import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { Group } from './group.model';
import { IGroup } from './group.interface';

const createGroupToDB = async (payload: IGroup) => {
     const { name } = payload;
     const isExistName = await Group.findOne({ name: name });

     if (isExistName) {
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'This Group Name Already Exist');
     }

     const createGroup: any = await Group.create(payload);
     if (!createGroup) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Group');
     }

     return createGroup;
};

const getGroupsFromDB = async (): Promise<IGroup[]> => {
     const result = await Group.find({});
     return result;
};

const updateGroupToDB = async (id: string, payload: IGroup) => {
     const isExistGroup: any = await Group.findById(id);
     if (!isExistGroup) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Group doesn't exist");
     }

     const updateCategory = await Group.findOneAndUpdate({ _id: id }, payload, {
          new: true,
     });

     return updateCategory;
};

const deleteGroupToDB = async (id: string): Promise<IGroup | null> => {
     const deleteGroup = await Group.findByIdAndDelete(id);
     if (!deleteGroup) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Group doesn't exist");
     }
     return deleteGroup;
};
const shuffleGroupSerial = async (groupOrder: Array<{ _id: string; serial: number }>) => {
     if (!groupOrder || !Array.isArray(groupOrder) || groupOrder.length === 0) {
          return;
     }
     const updatePromises = groupOrder.map((item) => Group.findByIdAndUpdate(item._id, { serial: item.serial }, { new: true }));

     const result = await Promise.all(updatePromises);
     return result;
};
export const GroupService = {
     createGroupToDB,
     getGroupsFromDB,
     updateGroupToDB,
     deleteGroupToDB,
     shuffleGroupSerial,
};
