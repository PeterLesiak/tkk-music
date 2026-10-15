import { Router } from 'express';
import {
  getAuditContext,
  requireBearerToken,
  requireStringField,
  requireValidSession,
} from '../../middlewares/auth.js';
import { requirePermission } from '../../middlewares/permission.js';
import {
  checkStaticEntryExists,
  createStaticScheduleEntry,
  daysOfWeek,
  deleteStaticScheduleById,
  getStaticSchedule,
  getStaticScheduleBiId,
  parseInputTime,
  updateStaticScheduleById,
  type WeekDay,
} from '../../data/staticScheduler.js';
import assert from 'node:assert';

const staticScheduleRouter = Router();

const parseId = (raw: unknown): number | null => {
  if (typeof raw !== 'string' || isNaN(parseInt(raw))) return null;
  return parseInt(raw);
};

staticScheduleRouter.get(
  '/static',
  requireBearerToken,
  requireValidSession,
  requirePermission('scheduling.static.view'),
  async (_req, res) => {
    // TODO: take params from req (query?)
    res.json(await getStaticSchedule());
  },
);

staticScheduleRouter.get(
  '/static/:id',
  requireBearerToken,
  requireValidSession,
  requirePermission('scheduling.static.view'),
  async (req, res) => {
    const id = parseId(req.params['id']);
    if (id === null) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
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
  requirePermission('scheduling.static.manage'),
  async (req, res) => {
    const loseDayWeek = req.params['weekDay'] as string;

    if (
      (isNaN(parseInt(loseDayWeek)) ||
        parseInt(loseDayWeek) >= daysOfWeek.length) &&
      !daysOfWeek.includes(loseDayWeek as WeekDay)
    ) {
      res.status(400).json({ error: `Invalid week day: ${loseDayWeek}` });
      return;
    }

    const dayOfWeekName: WeekDay = isNaN(parseInt(loseDayWeek))
      ? (loseDayWeek as WeekDay)
      : (daysOfWeek[parseInt(loseDayWeek)]! as WeekDay);

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
      res.status(409).json({ error: 'Entry already exists' });
      return;
    }

    await createStaticScheduleEntry(
      dayOfWeekName,
      startTime,
      endTime,
      label,
      req.userInfo.databaseId,
      description,
      getAuditContext(req),
    );
    res.status(201).json({ status: 'ok' });
  },
);

staticScheduleRouter.patch(
  '/static/:id',
  requireBearerToken,
  requireValidSession,
  requirePermission('scheduling.static.manage'),
  async (req, res) => {
    const id = parseId(req.params['id']);
    if (id === null) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const details = await getStaticScheduleBiId(id);
    if (!details) {
      res.status(404).json({ error: 'Invalid entry id' });
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
    else if (typeof isActive === 'boolean') details.isActive = isActive;

    assert(req.userInfo);
    details.updatedByUser = req.userInfo;

    const result = await updateStaticScheduleById(
      details,
      getAuditContext(req),
    );
    if (!result) {
      res.status(500).json({ error: 'Unexpected server error' });
      return;
    }
    res.status(200).json({ status: 'Ok' });
  },
);

staticScheduleRouter.delete(
  '/static/:id',
  requireBearerToken,
  requireValidSession,
  requirePermission('scheduling.static.manage'),
  async (req, res) => {
    const id = parseId(req.params['id']);
    if (id === null) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    assert(req.userInfo);

    const deleted = await deleteStaticScheduleById(
      id,
      req.userInfo.databaseId,
      getAuditContext(req),
    );
    if (!deleted) {
      res.status(404).json({ error: 'Invalid entry id' });
      return;
    }
    res.status(200).json({ status: 'Ok' });
  },
);

export default staticScheduleRouter;
