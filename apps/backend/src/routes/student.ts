import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getStudentDashboard, getStudentProfile } from '../controllers/studentController';

export const studentRouter = Router();

studentRouter.use(authenticate, authorize(['student', 'parent', 'school_admin', 'super_admin']));
studentRouter.get('/dashboard', getStudentDashboard);
studentRouter.get('/profile', getStudentProfile);
