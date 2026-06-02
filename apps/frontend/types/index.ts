export interface DashboardSummary {
  xp: number;
  level: number;
  streak: number;
  activeMissions: number;
  attendanceRate: number;
  gradeAverage: number;
  todayLessons: Array<{ title: string; description: string; completed: boolean }>;
}

export interface TutorResponse {
  id: string;
  content: string;
  createdAt: string;
}
