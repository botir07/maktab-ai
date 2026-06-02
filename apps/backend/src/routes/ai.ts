import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { tutorQuery } from '../controllers/aiController';

export const aiRouter = Router();

aiRouter.use(authenticate, authorize(['student', 'teacher', 'parent', 'school_admin', 'super_admin']));
aiRouter.post('/tutor', tutorQuery);
