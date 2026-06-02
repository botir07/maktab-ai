import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

export async function getSiteMetrics(req: AuthRequest, res: Response) {
  const [users, students, teachers, classes] = await Promise.all([
    query<{ total: number }>('SELECT COUNT(*)::int AS total FROM users'),
    query<{ total: number }>("SELECT COUNT(*)::int AS total FROM users WHERE role = 'student'"),
    query<{ total: number }>("SELECT COUNT(*)::int AS total FROM users WHERE role = 'teacher'"),
    query<{ total: number }>('SELECT COUNT(*)::int AS total FROM classes')
  ]);

  return res.json({
    totalUsers: users.rows[0]?.total ?? 0,
    totalStudents: students.rows[0]?.total ?? 0,
    totalTeachers: teachers.rows[0]?.total ?? 0,
    totalClasses: classes.rows[0]?.total ?? 0
  });
}
