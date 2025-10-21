import express from 'express';
import { DashboardController } from './dashboard.controller';

const router = express.Router();
router.get('/analytics', DashboardController.getAnalytics);
export const DashboardRouter = router;
