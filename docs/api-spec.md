# HANA SCHOOL AI API Specification

## Authentication

### POST /api/auth/otp/request
Request body:
- `channel` (email|phone|telegram)
- `email` required when `channel=email`
- `phone` required when `channel=phone`
- `telegramChatId` required when `channel=telegram`

Response:
- `message`
- `channel`
- `identifier`
- `expiresInMinutes`
- `devCode` only when `OTP_DEV_MODE=true`

### POST /api/auth/otp/verify
Request body:
- `channel` (email|phone|telegram)
- `code` (6 digit string)
- `email` required when `channel=email`
- `phone` required when `channel=phone`
- `telegramChatId` required when `channel=telegram`

Response:
- `message`
- `channel`
- `identifier`

### POST /api/auth/register
Request body:
- `email` (string)
- `phone` (optional string)
- `telegramChatId` (optional string)
- `password` (string)
- `name` (string)
- `role` (student|teacher|parent|school_admin|super_admin)
- `otpChannel` (email|phone|telegram) must already be verified

Response:
- `token`
- `user`

### POST /api/auth/login
Request body:
- `email`
- `password`

Response:
- `token`
- `user`

## Student

### GET /api/student/dashboard
Headers: `Authorization: Bearer <token>`
Response:
- `attendanceRate`
- `gradeAverage`
- `roadmap`
- `activeMissions`
- `todayLessons`

### GET /api/student/profile
Headers: `Authorization: Bearer <token>`
Response:
- `id`
- `email`
- `name`
- `role`
- `created_at`

## Teacher

### GET /api/teacher/classes
Headers: `Authorization: Bearer <token>`
Response:
- `classes[]` with `id`, `name`, `subject`, `student_count`

### GET /api/teacher/attendance-report
Headers: `Authorization: Bearer <token>`
Response:
- `attendance[]` with `class_name`, `attendance_rate`

## Admin

### GET /api/admin/metrics
Headers: `Authorization: Bearer <token>`
Response:
- `totalUsers`
- `totalStudents`
- `totalTeachers`
- `totalClasses`

## AI Tutor

### POST /api/ai/tutor
Headers: `Authorization: Bearer <token>`
Request body:
- `prompt` (string)
- `mode` (optional): `groq` | `openai` | `ollama` | `local`

Response:
- `content`
- `createdAt`
