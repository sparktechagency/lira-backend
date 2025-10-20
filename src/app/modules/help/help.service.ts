import { HelpModel } from './help.model';
import { Help } from './help.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import { logger } from '../../../shared/logger';

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
        .modelQuery.populate({
            path: 'userId',
            select: 'name email'
        })
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
    const message = await HelpModel.findByIdAndUpdate(
        id,
        {
            status: payload.status,
            ...(payload.reply && { reply: payload.reply })
        },
        { new: true, lean: true }
    ).populate({
        path: 'userId',
        select: 'name contact'
    });

    if (!message) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Help not found');
    }
    // Prepare email data
    const emailData = emailTemplate.helpReplyTemplate(
        {
            email: message.email,
            name: (message.userId as any)?.name || 'User',
            message: message.message || ''
        },
        payload.reply || message.reply || ''
    );
    // Send email asynchronously and log the result
    try {
        await emailHelper.sendEmail(emailData);
        logger.info('Reply email sent successfully', { email: message.email});
    } catch (err: any) {
        logger.error('Failed to send reply email', { error: err.message, email: message.email});
        throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send reply email');
    }

    return message;
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