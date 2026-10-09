import { Router } from 'express';
import authRouter from './auth/index.js';
import schedulerRouter from './schedule/index.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/scheduler', schedulerRouter);

export default router;
