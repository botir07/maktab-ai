import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getTeacherClasses, getAttendanceReport } from '../controllers/teacherController';

export const teacherRouter = Router();

teacherRouter.use(authenticate, authorize(['teacher', 'school_admin', 'super_admin']));
teacherRouter.get('/classes', getTeacherClasses);
teacherRouter.get('/attendance-report', getAttendanceReport);
