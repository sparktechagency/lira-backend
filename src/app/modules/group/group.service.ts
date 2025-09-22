import { StatusCodes } from 'http-status-codes';
import unlinkFile from '../../../shared/unlinkFile';
import AppError from '../../../errors/AppError';
import { Group } from './group.model';
import { IGroup } from './group.interface';

const createGroupToDB = async (payload: IGroup) => {
     const { name, image } = payload;
     const isExistName = await Group.findOne({ name: name });

     if (isExistName) {
          unlinkFile(image);
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'This Group Name Already Exist');
     }

     const createGroup: any = await Group.create(payload);
     if (!createGroup) {
          unlinkFile(image);
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

     if (payload.image) {
          unlinkFile(isExistGroup?.image);
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

export const GroupService = {
     createGroupToDB,
     getGroupsFromDB,
     updateGroupToDB,
     deleteGroupToDB,
};
