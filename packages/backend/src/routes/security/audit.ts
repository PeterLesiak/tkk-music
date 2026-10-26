import { Router } from 'express';
import {
  requireBearerToken,
  requireValidSession,
} from '../../middlewares/auth.js';
import { requirePermission } from '../../middlewares/permission.js';
import { AUDIT_MAX_LIMIT, getAuditLog, type AuditLogFilters } from '../../data/auditlog.js';

const auditRouter = Router();

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const parseDate = (raw: string | undefined): Date | null | undefined => {
  if (raw === undefined) return undefined;
  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
};

const parsePositiveInt = (
  raw: string | undefined,
): number | null | undefined => {
  if (raw === undefined) return undefined;
  if (!/^\d+$/.test(raw)) return null;
  const value = parseInt(raw, 10);
  return value > 0 ? value : null;
};

auditRouter.get(
  '/',
  requireBearerToken,
  requireValidSession,
  requirePermission('system.audit_log.view'),
  async (req, res) => {
    const q = req.query;

    const actor = asString(q['actor']);
    if (actor !== undefined && !/^[0-9a-f]{32}$/i.test(actor)) {
      res.status(400).json({ error: 'Invalid actor (expected 32 hex chars)' });
      return;
    }

    const successRaw = asString(q['success']);
    if (
      successRaw !== undefined &&
      successRaw !== 'true' &&
      successRaw !== 'false'
    ) {
      res.status(400).json({ error: 'Invalid success (true or false)' });
      return;
    }

    const from = parseDate(asString(q['from']));
    const to = parseDate(asString(q['to']));
    if (from === null || to === null) {
      res.status(400).json({ error: 'Invalid date (expected ISO 8601)' });
      return;
    }

    const before = parsePositiveInt(asString(q['before']));
    if (before === null) {
      res.status(400).json({ error: 'Invalid before cursor' });
      return;
    }

    const limit = parsePositiveInt(asString(q['limit']));
    if (limit === null || (limit !== undefined && limit > AUDIT_MAX_LIMIT)) {
      res
        .status(400)
        .json({ error: `Invalid limit (1..${AUDIT_MAX_LIMIT})` });
      return;
    }

    const filters: AuditLogFilters = {
      actorPublicId: actor?.toLowerCase(),
      action: asString(q['action']),
      targetType: asString(q['targetType']),
      targetId: asString(q['targetId']),
      success: successRaw === undefined ? undefined : successRaw === 'true',
      from,
      to,
      before,
      limit,
    };

    res.json(await getAuditLog(filters));
  },
);

export default auditRouter;