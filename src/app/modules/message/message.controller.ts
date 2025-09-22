import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { MessageService } from './message.service';
import { ChatService } from '../chat/chat.service';
import { FilesObject } from '../../interface/common.interface';
import { Request } from 'express';
import { updateFileName } from '../../utils/fileHelper';

const sendMessage = catchAsync(async (req, res) => {
  const { files } = req as Request & { files: FilesObject };
  const chatId: any = req.params.chatId;
  const { userId }: any = req.user;

  const images = files.images?.map((photo) =>
    updateFileName('images', photo.filename),
  );
  req.body.images = images;
  req.body.sender = userId;
  req.body.chatId = chatId;

  const message = await MessageService.sendMessageToDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Send Message Successfully',
    data: message,
  });
});

const getMessages = catchAsync(async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.user;

  // Mark messages as read when user opens the chat
  await ChatService.markChatAsRead(userId, chatId);

  const result = await MessageService.getMessagesFromDB(
    chatId,
    userId,
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Messages retrieved successfully',
    data: {
      messages: result.messages,
      pinnedMessages: result.pinnedMessages,
    },
    meta: {
      limit: result.pagination.limit,
      page: result.pagination.page,
      total: result.pagination.total,
      totalPage: result.pagination.totalPage,
    },
  });
});

const addReaction = catchAsync(async (req, res) => {
  const { userId }: any = req.user;
  const { messageId } = req.params;
  const { reactionType } = req.body;
  const messages = await MessageService.addReactionToMessage(
    userId,
    messageId,
    reactionType,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reaction Added Successfully',
    data: messages,
  });
});

const deleteMessage = catchAsync(async (req, res) => {
  const { userId }: any = req.user;
  const { messageId } = req.params;
  const messages = await MessageService.deleteMessage(userId, messageId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message Deleted Successfully',
    data: messages,
  });
});

// New controller: Pin/Unpin message
const pinUnpinMessage = catchAsync(async (req, res) => {
  const { userId }: any = req.user;
  const { messageId } = req.params;
  const { action } = req.body; // 'pin' or 'unpin'

  const result = await MessageService.pinUnpinMessage(
    userId,
    messageId,
    action,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Message ${action}ned successfully`,
    data: result,
  });
});

export const MessageController = {
  sendMessage,
  getMessages,
  addReaction,
  deleteMessage,
  pinUnpinMessage,
};
