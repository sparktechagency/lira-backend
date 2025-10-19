import { HelpModel } from './help.model';
import { Help } from './help.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';

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

    const meta = await queryBuilder.countTotal();

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
const updateHelpResolvedStatus = async (id: string, payload: { status: string, reply?: string }) => {

    const message = await HelpModel.findById(id)
        .populate({
            path: 'userId',
            select: 'name contact'
        });
    if (!message) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Help not found');
    }
    message.reply = payload.reply || '';
    await message.save();
    // Prepare the email template
    const data = {
        email: message.email,
        name: (message.userId as any).name,
        message: message?.message || '',
    }
    const emailData = emailTemplate.helpReplyTemplate(data, message?.reply || '');

    // Send email
    try {
        await emailHelper.sendEmail(emailData);
        console.log(`Reply email sent to ${message.email}`);
    } catch (err: any) {
        console.error('Failed to send reply email:', err);
        // Optional: Decide if you want to fail the API or just log
        throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send reply email');
    }

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