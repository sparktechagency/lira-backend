import { StatusCodes } from "http-status-codes";
import { USER_ROLES } from "../../../enums/user";
import AppError from "../../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { User } from "../user/user.model";

// get all users
const allUser = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(
    User.find({ role: { $nin: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN] } }).select('firstName lastName email image phone role address gender status'), // Exclude users with SUPER_ADMIN or ADMIN roles
    query, // Additional filters or query parameters passed in
  );

  const users = await queryBuilder
    .search(['firstName', 'lastName', "phone", 'email', 'address'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .modelQuery.exec();

  const meta = await queryBuilder.countTotal();

  return { users, meta };
};
// get single users
const singleUser = async (id: string) => {
  const result = await User.findById(id);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
  }
  return result;
};
// update  users
const updateUserStatus = async (id: string, status: string) => {
  const result = await User.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true },
  );
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
  }
  return result;
};


export const DashboardUserService = {
  allUser,
  singleUser,
  updateUserStatus
};
