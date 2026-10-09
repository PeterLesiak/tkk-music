import { Router } from 'express';
import { rolesPermissionsRouter } from './rolesPermissions.js';

const securityRouter = Router();

securityRouter.use(rolesPermissionsRouter);

export default securityRouter;
