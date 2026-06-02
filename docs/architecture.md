# HANA SCHOOL AI Architecture

## Overview

HANA SCHOOL AI is designed as a modern monorepo with separate frontend and backend applications. The system supports role-based access control, adaptive learning, AI tutoring, exam orchestration, and analytics.

## Key layers

- Frontend: Next.js app with responsive UI, dashboard views, gamification panels, and AI assistant interaction.
- Backend: Express API with PostgreSQL, secure JWT authentication, data validation, and AI service orchestration.
- Database: PostgreSQL schema optimized for multi-school tenancy, student performance analytics, and career guidance.

## API architecture

- `/api/auth` for registration and login.
- `/api/student` for student dashboards and profile management.
- `/api/teacher` for class management and attendance reporting.
- `/api/admin` for school-level metrics and user administration.
- `/api/ai` for AI tutor responses and adaptive recommendations.

## Adaptive learning flow

1. Students complete diagnostics or AI exam sessions.
2. The backend tracks performance across subjects and identifies gaps.
3. AI services generate personalized roadmaps and targeted practice.
4. Student progress is updated via assignments, grades, and achievements.

## Scalability

- PostgreSQL schema uses indexes for role, attendance, grades, exams, and assignments.
- Express is stateless; can be horizontally scaled behind a load balancer.
- Frontend is optimized for static builds and client-side hydration.
