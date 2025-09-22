import express from 'express';
import { MessageController } from './message.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import { FOLDER_NAMES } from '../../../enums/files';
import parseMultipleFileData from '../../middleware/parseMultipleFiledata';
const router = express.Router();

// Existing routes
router.post(
  '/send-message/:chatId',
  auth(
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ),
  fileUploadHandler(),
  parseMultipleFileData(FOLDER_NAMES.IMAGES),
  MessageController.sendMessage,
);

router.get(
  '/:chatId',
  auth(
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ),
  MessageController.getMessages,
);

router.post(
  '/react/:messageId',
  auth(
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ),
  MessageController.addReaction,
);

router.delete(
  '/delete/:messageId',
  auth(
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ),
  MessageController.deleteMessage,
);

// New route for pin/unpin message
router.patch(
  '/pin-unpin/:messageId',
  auth(
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ),
  MessageController.pinUnpinMessage,
);

export const messageRoutes = router;