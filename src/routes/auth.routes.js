import { Router } from 'express';
import { login, me } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth-jwt.js';
import { loginLimiter } from '../middlewares/rate-limiter.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../validators/auth.schema.js';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema, 'body'), login);
router.get('/me', authenticate, me);

export default router;
