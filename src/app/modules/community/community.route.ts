import express from "express";
import { CommunityController } from "./community.controller";
import auth from "../../middleware/auth";
import { USER_ROLES } from "../../../enums/user";

const router = express.Router();

router.post('/create', auth(USER_ROLES.USER), CommunityController.createCommunity);
router.post('/approve/:communityId', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), CommunityController.approveCommunity);
router.get('/posts', auth(USER_ROLES.USER), CommunityController.getCommunityPosts);
router.patch('/upvote/:postId', auth(USER_ROLES.USER), CommunityController.upVoteCommunity);
router.patch('/downvote/:postId', auth(USER_ROLES.USER), CommunityController.downVoteCommunity);
router.get('/voted-posts', auth(USER_ROLES.USER), CommunityController.getVotedPosts);
router.get('/my-posts', auth(USER_ROLES.USER), CommunityController.getMyPosts);



export const CommunityRoutes = router;