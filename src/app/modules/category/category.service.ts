import { StatusCodes } from 'http-status-codes';
import { ICategory } from './category.interface';
import { Category } from './category.model';
import unlinkFile from '../../../shared/unlinkFile';
import { Bookmark } from '../bookmark/bookmark.model';
import AppError from '../../../errors/AppError';

const createCategoryToDB = async (payload: ICategory) => {
     const { name } = payload;
     const isExistName = await Category.findOne({ name: name });

     if (isExistName) {
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'This Category Name Already Exist');
     }

     const createCategory: any = await Category.create(payload);
     if (!createCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Category');
     }

     return createCategory;
};

const getCategoriesFromDB = async (): Promise<ICategory[]> => {
     const result = await Category.find({});
     return result;
};

const updateCategoryToDB = async (id: string, payload: ICategory) => {
     const isExistCategory: any = await Category.findById(id);

     if (!isExistCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Category doesn't exist");
     }
     const updateCategory = await Category.findOneAndUpdate({ _id: id }, payload, {
          new: true,
     });

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
export const CategoryService = {
     createCategoryToDB,
     getCategoriesFromDB,
     updateCategoryToDB,
     deleteCategoryToDB,
     shuffleCategorySerial
};
