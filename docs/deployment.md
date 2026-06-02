# HANA SCHOOL AI Deployment Guide

## Environment variables

Create a `.env` file in `apps/backend` with the following values:

```
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/hana_school_ai
JWT_SECRET=super-secure-secret-key
FRONTEND_URL=http://localhost:3000
GROQ_API_KEY=
GROQ_API_URL=https://api.groq.dev/v1
GROQ_MODEL=groq2
OPENAI_API_KEY=
OLLAMA_URL=http://localhost:11434
LOCAL_MODEL_URL=http://127.0.0.1:8000
```

## Local development

1. Install dependencies from the workspace root:
   ```bash
   pnpm install
   ```
2. Create the database and run `db/schema.sql`.
3. Start the backend:
   ```bash
   pnpm --filter backend dev
   ```
4. Start the frontend:
   ```bash
   pnpm --filter frontend dev
   ```

## Production deployment

- Use PostgreSQL managed service or dedicated cluster.
- Set secure `JWT_SECRET` and database credentials.
- Build backend with `pnpm --filter backend build` and deploy with Node.js.
- Build frontend with `pnpm --filter frontend build` and deploy as a static app or edge-enabled site.
- Configure CORS to allow the frontend origin.
- Enable HTTPS and set strong API rate limiting in production.

## Scaling recommendations

- Run backend instances behind a load balancer.
- Enable connection pooling for PostgreSQL.
- Use Redis or caching layer for sessionless AI prompt results.
- Monitor query performance and tune indexes on attendance, grades, and exam results.
