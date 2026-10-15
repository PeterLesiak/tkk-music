import type { Response, Request, NextFunction } from 'express';
import { getAuditContext } from './auth.js';
import {
  getUserPermissions,
  type PermissionCode,
} from '../data/permissions.js';
import { tryWriteAuditLog } from '../data/auditlog.js';

export const requirePermission =
  (name: PermissionCode) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.userInfo) {
          res
            .status(401)
            .json({ error: 'This endpoint requires authorisation' });
          return;
        }

        const userPerms = await getUserPermissions(req.userInfo.userPublicId);

        if (!userPerms.has(name)) {
          await tryWriteAuditLog({
            action: 'permission.denied',
            actorUserId: req.userInfo.databaseId,
            targetType: 'permission',
            targetId: name,
            success: false,
            newValue: { method: req.method, path: req.originalUrl },
            ...getAuditContext(req),
          });
          res.status(403).json({
            error: `Access denied (missing permission: ${name})`,
          });
          return;
        }
        next();
      } catch (error) {
        next(error);
      }
    };