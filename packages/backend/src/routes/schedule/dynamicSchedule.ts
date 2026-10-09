import { Router } from 'express';
import {
  requireBearerToken,
  requireValidSession,
} from '../../middlewares/auth.js';
import { requirePermission } from '../../middlewares/permission.js';
import { getDynamicSchedule } from '../../data/dynamicScheduler.js';

const dynamicSchedulerRouter = Router();

dynamicSchedulerRouter.get(
  '/dynamic',
  requireBearerToken,
  requireValidSession,
  await requirePermission('scheduling.dynamic.view'),
  async (_req, res) => {
    // TODO: take params from req (query?)
    res.json(await getDynamicSchedule());
  },
);

export default dynamicSchedulerRouter;
