import { Router } from 'express';
import staticScheduleRouter from './staticSchedule.js';
import dynamicSchedulerRouter from './dynamicSchedule.js';

const schedulerRouter = Router();

schedulerRouter.use(staticScheduleRouter);
schedulerRouter.use(dynamicSchedulerRouter);

export default schedulerRouter;
