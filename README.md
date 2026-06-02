# HANA SCHOOL AI

HANA SCHOOL AI is a production-ready education ecosystem built for adaptive learning, AI tutoring, gamification, and school administration at scale.

## Project structure

- `apps/frontend` – Next.js + TypeScript + Tailwind UI for students, teachers, parents, and admins.
- `apps/backend` – Express API server with JWT authentication, PostgreSQL integration, role-based access control, AI orchestration, and analytics.
- `db/schema.sql` – PostgreSQL schema for users, schools, classes, attendance, grades, exams, assignments, achievements, and AI learning models.
- `docs/` – Architecture, API specification, roadmap, and deployment guides.

## Quick start

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create `.env` files in `apps/backend` with your PostgreSQL and AI credentials.
3. Run the backend and frontend:
   ```bash
   pnpm dev:backend
   pnpm dev:frontend
   ```

## Production readiness

- Role based access control for Student, Teacher, Parent, School Admin, Super Admin.
- Adaptive learning engine with learning gap detection and personalized roadmaps.
- AI-powered exam, tutoring, career guidance, and analytics services.
- Responsive mobile-first UI with Dark Mode support.
- PostgreSQL schema designed for thousands of students and multiple schools.

