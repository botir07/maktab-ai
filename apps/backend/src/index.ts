import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { studentRouter } from './routes/student';
import { teacherRouter } from './routes/teacher';
import { adminRouter } from './routes/admin';
import { aiRouter } from './routes/ai';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/student', studentRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ai', aiRouter);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`HANA SCHOOL AI backend running on http://localhost:${port}`);
});
