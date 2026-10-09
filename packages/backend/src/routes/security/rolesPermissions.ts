import { Router } from 'express';
import { meRouter } from './rolesPermissions/me.js';

const router = Router();

router.use('/@me', meRouter);

export const rolesPermissionsRouter = router;
