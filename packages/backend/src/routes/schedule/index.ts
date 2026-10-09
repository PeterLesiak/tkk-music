import { Router } from 'express';
import staticScheduleRouter from './staticSchedule.js';

const schedulerRouter = Router();

schedulerRouter.use(staticScheduleRouter);

export default schedulerRouter;
