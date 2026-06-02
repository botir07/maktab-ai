import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getSiteMetrics } from '../controllers/adminController';

export const adminRouter = Router();

adminRouter.use(authenticate, authorize(['school_admin', 'super_admin']));
adminRouter.get('/metrics', getSiteMetrics);
