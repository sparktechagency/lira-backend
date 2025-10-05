import express from "express";
import { CommunityController } from "./community.controller";
import auth from "../../middleware/auth";
import { USER_ROLES } from "../../../enums/user";

const router = express.Router();

router.post('/create', auth(USER_ROLES.USER), CommunityController.createCommunityVote);
router.post('/approve/:communityId', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), CommunityController.approveCommunity);


export const CommunityRoutes = router;