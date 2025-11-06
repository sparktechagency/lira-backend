import { StatusCodes } from "http-status-codes";
import { IWaitList } from "./waitList.interface";
import { WaitListModel } from "./waitList.model";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../../errors/AppError";

const createWaitList = async (payload: IWaitList) => {
    const result = await WaitListModel.create(payload);
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'WaitList creation failed');
    }
    return result;
}

const getAllWaitList = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(WaitListModel.find().populate('userId', 'name image email').populate('contestId', 'title image price name group category'), query);
    const result = await queryBuilder.filter().fields().paginate().sort().modelQuery.exec();
    const meta = await queryBuilder.countTotal();
    return {
        meta,
        result
    };
}

const getSingleWaitList = async (id: string) => {
    const result = await WaitListModel.findById(id).populate('userId', 'name image email').populate('contestId', 'title image price name group category');
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'WaitList fetch failed');
    }
    return result;
}

const deleteWaitList = async (id: string) => {
    const result = await WaitListModel.findByIdAndDelete(id);
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'WaitList delete failed');
    }
    return result;
}
export const WaitListService = {
    createWaitList,
    getAllWaitList,
    getSingleWaitList,
    deleteWaitList,
}
