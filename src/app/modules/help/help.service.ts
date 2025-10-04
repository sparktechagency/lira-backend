import { HelpModel } from './help.model';
import { Help } from './help.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

const createHelp = async (payload: Help) => {
    const result = await HelpModel.create(payload);
    return result;
};
const getAllHelpsDataFromDb = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(HelpModel.find(), query)

    const result = await queryBuilder.filter()
        .sort()
        .paginate()
        .fields()
        .modelQuery
        .exec();

    const meta = queryBuilder.countTotal;

    return {
        result,
        meta,
    };
};
const getSingleHelpFromDb = async (id: string) => {
    const result = await HelpModel.findById(id);
    if (!result) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Help not found');
    }
    return result;
};
const updateHelpResolvedStatus = async (id: string, payload: { status: string }) => {
    const result = await HelpModel.findByIdAndUpdate(id, payload, { new: true });
    if (!result) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Help not found');
    }
    return result;
};
const deleteHelp = async (id: string) => {
    const result = await HelpModel.findByIdAndDelete(id);
    if (!result) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Help not found');
    }
    return result;
};
export const HelpService = {
    createHelp,
    getAllHelpsDataFromDb,
    getSingleHelpFromDb,
    updateHelpResolvedStatus,
    deleteHelp,

};