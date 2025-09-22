import express from 'express';
import { BookmarkController } from './bookmark.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';

const router = express.Router();

// Route to toggle a bookmark (add/remove)
router.post('/toggle', auth(USER_ROLES.USER), BookmarkController.toggleBookmark);

// Route to get all bookmarks for the authenticated user (optionally filtered by referenceType)
router.get('/', auth(USER_ROLES.USER), BookmarkController.getBookmark);

// Route to delete a bookmark for the authenticated user
router.delete('/:referenceId/:referenceType', auth(USER_ROLES.USER), BookmarkController.deleteBookmark);

// Route to get all bookmarks for a user
router.get('/user', auth(USER_ROLES.USER), BookmarkController.getUserBookmarks);
export const BookmarkRoutes = router;
