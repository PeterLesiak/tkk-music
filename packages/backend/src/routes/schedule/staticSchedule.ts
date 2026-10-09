import { Router } from 'express';
import {
  requireBearerToken,
  requireStringField,
  requireValidSession,
} from '../../middlewares/auth.js';
import { requirePermission } from '../../middlewares/permission.js';
import {
  checkStaticEntryExists,
  createStaticScheduleEntry,
  daysOfWeek,
  getStaticSchedule,
  getStaticScheduleBiId,
  parseInputTime,
  updateStaticScheduleById,
  type WeekDay,
} from '../../data/staticScheduler.js';
import assert from 'node:assert';
import { isBooleanObject } from 'node:util/types';

const staticScheduleRouter = Router();
staticScheduleRouter.get(
  '/static',
  requireBearerToken,
  requireValidSession,
  await requirePermission('scheduling.static.view'),
  async (_req, res) => {
    // TODO: take params from req (query?)
    res.json(await getStaticSchedule());
  },
);
staticScheduleRouter.get(
  '/static/:id',
  requireBearerToken,
  requireValidSession,
  await requirePermission('scheduling.static.view'),
  async (req, res) => {
    const loseId = req.params['id'];
    if (!loseId || isNaN(parseInt(loseId as string))) {
      res.status(400).json({
        error: 'Invalid id',
      });
      return;
    }
    const id = parseInt(loseId as string);
    res.json(await getStaticScheduleBiId(id));
  },
);
staticScheduleRouter.put(
  '/static/:weekDay',
  requireBearerToken,
  requireValidSession,
  requireStringField('startTime'),
  requireStringField('endTime'),
  requireStringField('label'),
  await requirePermission('scheduling.static.manage'),
  async (req, res) => {
    const loseDayWeek = req.params['weekDay'] as string;

    if (
      (isNaN(parseInt(loseDayWeek)) ||
        parseInt(loseDayWeek) >= daysOfWeek.length) &&
      !daysOfWeek.includes(loseDayWeek as WeekDay)
    ) {
      res
        .status(400)
        .json({ error: `Invalid week day: ${req.params['weekDay']}` });
      return;
    }

    const dayOfWeekName: WeekDay = isNaN(parseInt(loseDayWeek))
      ? (loseDayWeek as WeekDay)
      : (daysOfWeek[
          parseInt(req.params['weekDay'] as unknown as string)
        ]! as WeekDay);

    const {
      startTime: startTimeRaw,
      endTime: endTimeRaw,
      label,
      description,
    } = req.body;
    assert(req.userInfo);
    const startTime = parseInputTime(startTimeRaw);
    const endTime = parseInputTime(endTimeRaw);
    if (!startTime || !endTime) {
      res
        .status(400)
        .json({ error: 'Invalid time format. Expected: hh:mm or hh:mm:ss' });
      return;
    }
    if (await checkStaticEntryExists(dayOfWeekName, startTime)) {
      res.status(409).json({
        error: 'Entry already exists',
      });
      return;
    }

    await createStaticScheduleEntry(
      dayOfWeekName,
      startTime,
      endTime,
      label,
      req.userInfo.databaseId,
      description,
    );
    res.status(201).json({ status: 'ok' });
  },
);
staticScheduleRouter.patch(
  '/static/:id',
  requireBearerToken,
  requireValidSession,
  await requirePermission('scheduling.static.manage'),
  async (req, res) => {
    const loseId = req.params['id'];
    if (!loseId || isNaN(parseInt(loseId as string))) {
      res.status(400).json({
        error: 'Invalid id',
      });
      return;
    }
    const id = parseInt(loseId as string);
    let details = await getStaticScheduleBiId(id);
    if (!details) {
      res.status(404).json({
        error: 'Invalid entry id',
      });
      return;
    }

    const {
      startTime: startTimeRaw,
      endTime: endTimeRaw,
      label,
      description,
      isActive,
    } = req.body;
    const startTime = parseInputTime(startTimeRaw);
    const endTime = parseInputTime(endTimeRaw);

    if (startTime) details.startTime = startTime;
    if (endTime) details.endTime = endTime;
    if (label) details.label = label;
    if (description) details.description = description;
    if (isActive === 'true') details.isActive = true;
    else if (isActive === 'false') details.isActive = false;
    else if (isBooleanObject(isActive)) details.isActive = isActive as boolean;

    assert(req.userInfo);

    details.updatedByUser = req.userInfo;

    const result = await updateStaticScheduleById(details);
    if (!result) {
      res.status(500).json({
        error: 'Unexpected server error',
      });
      return;
    }
    res.status(200).json({
      status: 'Ok',
    });
  },
);
staticScheduleRouter.delete(
  '/static/:id',
  requireBearerToken,
  requireValidSession,
  await requirePermission('scheduling.static.manage'),
  async (req, res) => {
    const loseId = req.params['id'];
    if (!loseId || isNaN(parseInt(loseId as string))) {
      res.status(400).json({
        error: 'Invalid id',
      });
      return;
    }
    const id = parseInt(loseId as string);
    let details = await getStaticScheduleBiId(id);
    if (!details) {
      res.status(404).json({
        error: 'Invalid entry id',
      });
      return;
    }

    const result = await updateStaticScheduleById(details);
    if (!result) {
      res.status(500).json({
        error: 'Unexpected server error',
      });
      return;
    }
    res.status(200).json({
      status: 'Ok',
    });
  },
);

export default staticScheduleRouter;
