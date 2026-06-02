import { Request, Response } from 'express';
import { z } from 'zod';
import { generateTutorResponse } from '../services/aiService';
import { AuthRequest } from '../middleware/auth';

const tutorSchema = z.object({
  prompt: z.string().min(5),
  mode: z.enum(['groq', 'openai', 'ollama', 'local']).optional()
});

export async function tutorQuery(req: AuthRequest, res: Response) {
  const parse = tutorSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid tutor request.', errors: parse.error.flatten() });
  }

  const { prompt, mode } = parse.data;
  const content = await generateTutorResponse({ prompt, mode });
  return res.json({ content, createdAt: new Date().toISOString() });
}
