import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

export async function getStudentDashboard(req: AuthRequest, res: Response) {
  const userId = req.auth?.id;
  const student = await query<{ id: string; name: string; email: string; role: string; created_at: string }>(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1 AND role = $2',
    [userId, 'student']
  );

  if (!student.rows.length) {
    return res.status(404).json({ message: 'Student account not found.' });
  }

  const [
    attendance,
    gradeSummary,
    subjects,
    lessons,
    homework,
    achievements,
    roadmap,
    streak,
    xp,
    exams
  ] = await Promise.all([
    query<{ total: number; present: number }>(
      `SELECT COUNT(*)::int AS total,
              COALESCE(SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END), 0)::int AS present
       FROM attendance
       WHERE student_id = $1`,
      [userId]
    ),
    query<{ average_grade: number }>(
      `SELECT COALESCE(AVG((score / NULLIF(max_score, 0)) * 100), 0)::numeric(5,2) AS average_grade
       FROM grades
       WHERE student_id = $1`,
      [userId]
    ),
    query<{ id: string; name: string; code: string; teacher_name: string | null; progress: number }>(
      `SELECT s.id,
              s.name,
              s.code,
              teacher.name AS teacher_name,
              COALESCE(ROUND(AVG((g.score / NULLIF(g.max_score, 0)) * 100)), 0)::int AS progress
       FROM enrollments e
       JOIN classes c ON c.id = e.class_id
       JOIN subjects s ON s.id = c.subject_id
       LEFT JOIN users teacher ON teacher.id = c.teacher_id
       LEFT JOIN grades g ON g.student_id = e.student_id AND g.subject_id = s.id
       WHERE e.student_id = $1 AND e.status = 'active'
       GROUP BY s.id, s.name, s.code, teacher.name
       ORDER BY s.name`,
      [userId]
    ),
    query<{ id: string; title: string; subject: string; teacher_name: string | null; term: string | null }>(
      `SELECT c.id,
              s.name AS title,
              s.code AS subject,
              teacher.name AS teacher_name,
              c.term
       FROM enrollments e
       JOIN classes c ON c.id = e.class_id
       JOIN subjects s ON s.id = c.subject_id
       LEFT JOIN users teacher ON teacher.id = c.teacher_id
       WHERE e.student_id = $1 AND e.status = 'active'
       ORDER BY s.name
       LIMIT 6`,
      [userId]
    ),
    query<{ id: string; title: string; description: string | null; due_date: string | null; status: string; subject: string | null }>(
      `SELECT a.id,
              a.title,
              a.description,
              a.due_date::text,
              a.status,
              s.name AS subject
       FROM assignments a
       LEFT JOIN subjects s ON s.id = a.subject_id
       WHERE a.student_id = $1
       ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC
       LIMIT 8`,
      [userId]
    ),
    query<{ id: string; title: string; description: string | null; points: number; awarded_at: string }>(
      `SELECT id, title, description, points, awarded_at::text
       FROM achievements
       WHERE student_id = $1
       ORDER BY awarded_at DESC
       LIMIT 6`,
      [userId]
    ),
    query<{ milestone: string; progress: number }>(
      `SELECT milestone, progress
       FROM learning_roadmaps
       WHERE student_id = $1
       ORDER BY created_at DESC
       LIMIT 6`,
      [userId]
    ),
    query<{ streak: number }>(
      `WITH ordered_days AS (
         SELECT DISTINCT date
         FROM attendance
         WHERE student_id = $1 AND status IN ('present', 'late')
       ),
       streak_days AS (
         SELECT date,
                ROW_NUMBER() OVER (ORDER BY date DESC) AS row_num
         FROM ordered_days
         WHERE date <= CURRENT_DATE
       )
       SELECT COUNT(*)::int AS streak
       FROM streak_days
       WHERE date = CURRENT_DATE - ((row_num - 1)::int)`,
      [userId]
    ),
    query<{ points: number }>(
      `SELECT COALESCE(SUM(points), 0)::int AS points
       FROM achievements
       WHERE student_id = $1`,
      [userId]
    ),
    query<{ id: string; title: string; scheduled_at: string | null; subject: string | null; difficulty: string }>(
      `SELECT ex.id,
              ex.title,
              ex.scheduled_at::text,
              s.name AS subject,
              ex.difficulty
       FROM exams ex
       LEFT JOIN subjects s ON s.id = ex.subject_id
       LEFT JOIN enrollments e ON e.class_id = ex.class_id AND e.student_id = $1
       WHERE ex.scheduled_at >= NOW()
         AND (e.student_id = $1 OR ex.class_id IS NULL)
       ORDER BY ex.scheduled_at ASC
       LIMIT 6`,
      [userId]
    )
  ]);

  const total = attendance.rows[0]?.total ?? 0;
  const present = attendance.rows[0]?.present ?? 0;
  const xpPoints = xp.rows[0]?.points ?? 0;
  const pendingHomework = homework.rows.filter((item) => item.status !== 'completed');
  const upcomingExams = exams.rows;
  const notifications = [
    ...pendingHomework.slice(0, 3).map((item) => ({
      id: `homework-${item.id}`,
      title: 'Homework due',
      message: `${item.title}${item.due_date ? ` is due on ${item.due_date}` : ' is waiting for submission'}.`,
      type: 'homework'
    })),
    ...upcomingExams.slice(0, 3).map((item) => ({
      id: `exam-${item.id}`,
      title: 'Upcoming exam',
      message: `${item.title}${item.scheduled_at ? ` is scheduled for ${item.scheduled_at}` : ' has been scheduled'}.`,
      type: 'exam'
    }))
  ];

  return res.json({
    profile: student.rows[0],
    attendanceRate: total ? Math.round((present / total) * 100) : 0,
    gradeAverage: Number(gradeSummary.rows[0]?.average_grade ?? 0),
    currentSubjects: subjects.rows,
    todayLessons: lessons.rows.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      subject: lesson.subject,
      teacherName: lesson.teacher_name,
      time: lesson.term ?? 'Today'
    })),
    homework: homework.rows,
    achievements: achievements.rows,
    roadmap: roadmap.rows,
    learningProgress: roadmap.rows.length
      ? Math.round(roadmap.rows.reduce((sum, item) => sum + Number(item.progress), 0) / roadmap.rows.length)
      : 0,
    dailyStreak: streak.rows[0]?.streak ?? 0,
    xpPoints,
    level: Math.max(1, Math.floor(xpPoints / 500) + 1),
    upcomingExams,
    notifications
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
