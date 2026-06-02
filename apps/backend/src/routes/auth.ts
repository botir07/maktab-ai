import { Router } from 'express';
import { loginHandler, registerHandler, requestOtpHandler, verifyOtpHandler } from '../controllers/authController';

export const authRouter = Router();

authRouter.post('/otp/request', requestOtpHandler);
authRouter.post('/otp/verify', verifyOtpHandler);
authRouter.post('/register', registerHandler);
authRouter.post('/login', loginHandler);
