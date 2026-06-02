import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

export async function getStudentDashboard(req: AuthRequest, res: Response) {
  const userId = req.auth?.id;
  const student = await query<{ id: string }>('SELECT id FROM users WHERE id = $1 AND role = $2', [userId, 'student']);

  if (!student.rows.length) {
    return res.status(404).json({ message: 'Student account not found.' });
  }

  const [attendance, gradeSummary, roadmap, missions] = await Promise.all([
    query<{ total: number; present: number }>(
      'SELECT COUNT(*)::int AS total, SUM(CASE WHEN status = $2 THEN 1 ELSE 0 END)::int AS present FROM attendance WHERE student_id = $1',
      [userId, 'present']
    ),
    query<{ average_grade: number }>(
      'SELECT AVG(score)::numeric(5,2) AS average_grade FROM grades WHERE student_id = $1',
      [userId]
    ),
    query<{ milestone: string; progress: number }>(
      'SELECT milestone, progress FROM roadmaps WHERE student_id = $1 ORDER BY created_at DESC LIMIT 3',
      [userId]
    ),
    query<{ title: string; due_date: string; status: string }>(
      'SELECT title, due_date::text, status FROM assignments WHERE student_id = $1 ORDER BY due_date ASC LIMIT 4',
      [userId]
    )
  ]);

  const total = attendance.rows[0]?.total ?? 0;
  const present = attendance.rows[0]?.present ?? 0;

  return res.json({
    attendanceRate: total ? Math.round((present / total) * 100) : 0,
    gradeAverage: Number(gradeSummary.rows[0]?.average_grade ?? 0),
    roadmap: roadmap.rows,
    activeMissions: missions.rows.length,
    todayLessons: [
      { title: 'AI tutor review', description: 'Complete adaptive exercises for your AI learning path.', completed: false },
      { title: 'Geometry concept drill', description: 'Practice proofs and shapes to strengthen your gap areas.', completed: false }
    ]
  });
}

export async function getStudentProfile(req: AuthRequest, res: Response) {
  const userId = req.auth?.id;
  const result = await query<{ id: string; email: string; name: string; role: string; created_at: string }>(
    'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
    [userId]
  );
  const profile = result.rows[0];
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found.' });
  }

  return res.json(profile);
}
