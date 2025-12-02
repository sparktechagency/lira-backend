import express from "express";
import { CommunityController } from "./community.controller";
import auth from "../../middleware/auth";
import { USER_ROLES } from "../../../enums/user";

const router = express.Router();

router.post('/create', auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), CommunityController.createCommunity);
router.patch('/approve/:communityId', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), CommunityController.approveCommunity);
router.get('/posts', auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), CommunityController.getCommunityPosts);
router.get('/posts/:postId', auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), CommunityController.getSingleCommunityPost);
router.patch('/upvote/:postId', auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), CommunityController.upVoteCommunity);
router.patch('/downvote/:postId', auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), CommunityController.downVoteCommunity);
router.get('/voted-posts', auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), CommunityController.getVotedPosts);
router.get('/my-posts', auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), CommunityController.getMyPosts);
router.delete('/posts/:postId', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), CommunityController.deleteCommunityPost);


export const CommunityRoutes = router;