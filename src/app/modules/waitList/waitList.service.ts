import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { IWaitList } from "./waitList.interface";
import { WaitListModel } from "./waitList.model";

const createWaitList = async (payload: IWaitList) => {
    const result = await WaitListModel.create(payload);
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'WaitList creation failed');
    }
    return result;
}

const getAllWaitList = async () => {
    const result = await WaitListModel.find().populate('userId', 'name image email');
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'WaitList fetch failed');
    }
    return result;
}

export const WaitListService = {
    createWaitList,
    getAllWaitList,
}
