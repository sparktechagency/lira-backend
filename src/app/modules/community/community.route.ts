import express from "express";
import { CommunityController } from "./community.controller";
import auth from "../../middleware/auth";
import { USER_ROLES } from "../../../enums/user";

const router = express.Router();

router.post('/create', auth(USER_ROLES.USER), CommunityController.createCommunityVote);

export const CommunityRoutes = router;