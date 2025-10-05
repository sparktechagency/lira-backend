import express from "express";
import { CommunityController } from "./community.controller";
import auth from "../../middleware/auth";
import { USER_ROLES } from "../../../enums/user";

const router = express.Router();

router.post('/create', auth(USER_ROLES.USER), CommunityController.createCommunity);
router.post('/approve/:communityId', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), CommunityController.approveCommunity);
router.get('/posts', auth(USER_ROLES.USER), CommunityController.getCommunityPosts);
router.post('/upvote/:postId', auth(USER_ROLES.USER), CommunityController.upVoteCommunity);
router.get('/voted-posts', auth(USER_ROLES.USER), CommunityController.getVotedPosts);



export const CommunityRoutes = router;