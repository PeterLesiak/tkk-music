import { Router } from 'express';
import authRouter from './auth/index.js';
import schedulerRouter from './schedule/index.js';
import securityRouter from './security/index.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/scheduler', schedulerRouter);
router.use('/security', securityRouter);

export default router;
