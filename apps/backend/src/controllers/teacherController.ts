import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../db';

export async function getTeacherClasses(req: AuthRequest, res: Response) {
  const teacherId = req.auth?.id;
  const result = await query<{ id: string; name: string; subject: string; student_count: number }>(
    `SELECT c.id, c.name, s.name AS subject, COUNT(e.student_id) AS student_count
     FROM classes c
     JOIN subjects s ON c.subject_id = s.id
     LEFT JOIN enrollments e ON e.class_id = c.id
     WHERE c.teacher_id = $1
     GROUP BY c.id, c.name, s.name`,
    [teacherId]
  );

  return res.json({ classes: result.rows });
}

export async function getAttendanceReport(req: AuthRequest, res: Response) {
  const teacherId = req.auth?.id;
  const result = await query<{ class_name: string; attendance_rate: number }>(
    `SELECT c.name AS class_name,
            ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::decimal * 100 / NULLIF(COUNT(a.*), 0), 2) AS attendance_rate
     FROM attendance a
     JOIN classes c ON a.class_id = c.id
     WHERE c.teacher_id = $1
     GROUP BY c.name`,
    [teacherId]
  );

  return res.json({ attendance: result.rows });
}
