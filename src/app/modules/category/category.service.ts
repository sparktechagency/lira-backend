import { StatusCodes } from 'http-status-codes';
import { ICategory } from './category.interface';
import { Category } from './category.model';
import AppError from '../../../errors/AppError';
import { Group } from '../group/group.model';

const createCategoryToDB = async (payload: ICategory) => {
     const { name, groupId } = payload;
     const isExistName = await Category.findOne({ name: name });

     if (isExistName) {
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'This Category Name Already Exist');
     }

     const group = await Group.findById(groupId);
     if (!group) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Group not found');
     }
     payload.group = group.name;


     const createCategory: any = await Category.create(payload);
     if (!createCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Category');
     }

     return createCategory;
};

const getCategoriesFromDB = async (id: string): Promise<ICategory[]> => {
     if (id) {
          const result = await Category.find({ groupId: id }).sort({ serial: 1 });
          return result;
     }
     const result = await Category.find({}).sort({ serial: 1 });
     return result;
};

const updateCategoryToDB = async (id: string, payload: ICategory) => {
     const { name, groupId } = payload;
     // Check if category exists
     const isExistCategory = await Category.findById(id);
     if (!isExistCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Category doesn't exist");
     }

     if (name) {
          const isExistName = await Category.findOne({
               name: name,
               _id: { $ne: id }
          });

          if (isExistName) {
               throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'This Category Name Already Exist');
          }
     }
     // If groupId is provided, validate and set group name
     if (groupId) {
          const group = await Group.findById(groupId);
          if (!group) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Group not found');
          }
          payload.group = group.name;
     }

     const updateCategory = await Category.findOneAndUpdate(
          { _id: id },
          payload,
          { new: true }
     );

     if (!updateCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update Category');
     }
     return updateCategory;
};

const deleteCategoryToDB = async (id: string): Promise<ICategory | null> => {
     const deleteCategory = await Category.findByIdAndDelete(id);
     if (!deleteCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Category doesn't exist");
     }
     return deleteCategory;
};
const shuffleCategorySerial = async (categoryOrder: Array<{ _id: string; serial: number }>) => {
     if (!categoryOrder || !Array.isArray(categoryOrder) || categoryOrder.length === 0) {
          return;
     }
     const updatePromises = categoryOrder.map((item) => Category.findByIdAndUpdate(item._id, { serial: item.serial }, { new: true }));

     const result = await Promise.all(updatePromises);
     return result;
};

const getCategoryByGroupId = async (id: string) => {
     const result = await Category.find({ groupId: id }).select("-createdBy -updatedAt");
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
     }
     return result;
}
const getCategoryById = async (id: string) => {
     const result = await Category.findById(id).select("-createdBy -updatedAt");
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
     }
     return result;
}
export const CategoryService = {
     createCategoryToDB,
     getCategoriesFromDB,
     updateCategoryToDB,
     deleteCategoryToDB,
     shuffleCategorySerial,
     getCategoryByGroupId,
     getCategoryById
};
