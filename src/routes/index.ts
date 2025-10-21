import express from 'express';
import { UserRouter } from '../app/modules/user/user.route';
import { AuthRouter } from '../app/modules/auth/auth.route';
import SettingsRouter from '../app/modules/settings/settings.route';
import { CategoryRoutes } from '../app/modules/category/category.route';
import { GroupRoutes } from '../app/modules/group/group.route';
import { UnitTypeRoute } from '../app/modules/unit-type/unit-type.route';
import { ContestRoutes } from '../app/modules/contest/contest.route';
import { UserManagementsRouter } from '../app/modules/userManagements/userManagements.router';
import { OrderRoutes } from '../app/modules/order/order.route';
import { ReferralRoutes } from '../app/modules/referral/referral.routes';
import { PaymentRoutes } from '../app/modules/payments/payments.route';
import { HelpRouter } from '../app/modules/help/help.route';
import { CommunityRoutes } from '../app/modules/community/community.route';
import { ManuallyWinnerContestRoutes } from '../app/modules/manuallyWinnerContest/manuallyWinnerContest.route';
import { DashboardRouter } from '../app/modules/dashboard/dashboard.route';

const router = express.Router();
const routes = [
     {
          path: '/auth',
          route: AuthRouter,
     },
     {
          path: '/users',
          route: UserRouter,
     },
     {
          path: '/settings',
          route: SettingsRouter,
     },
     {
          path: '/categories',
          route: CategoryRoutes,
     },
     {
          path: '/groups',
          route: GroupRoutes,
     },
     {
          path: '/unit-type',
          route: UnitTypeRoute,
     },
     {
          path: '/contest',
          route: ContestRoutes,
     },
     {
          path: '/user-managements',
          route: UserManagementsRouter,
     },
     {
          path: '/orders',
          route: OrderRoutes,
     },
     {
          path: '/referrals',
          route: ReferralRoutes,
     },
     {
          path: '/payments',
          route: PaymentRoutes,
     },
     {
          path: '/help',
          route: HelpRouter,
     },
     {
          path: '/community',
          route: CommunityRoutes,
     },
     {
          path: '/manually-winner-contest',
          route: ManuallyWinnerContestRoutes,
     },
     {
          path: '/dashboard',
          route: DashboardRouter,
     },

];

routes.forEach((element) => {
     if (element?.path && element?.route) {
          router.use(element?.path, element?.route);
     }
});

export default router;
