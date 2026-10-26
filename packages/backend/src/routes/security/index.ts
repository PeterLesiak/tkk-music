import { Router } from 'express';
import { rolesPermissionsRouter } from './rolesPermissions.js';
import auditRouter from './audit.js';

const securityRouter = Router();

securityRouter.use(rolesPermissionsRouter);
securityRouter.use('/audit', auditRouter);

export default securityRouter;