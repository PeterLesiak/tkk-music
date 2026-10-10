import type { Response, Request, NextFunction } from 'express';
import './auth.js';
import {
  getPermission,
  getUserPermissions,
  type PermissionCode,
} from '../data/permissions.js';

export const requirePermission = async (name: PermissionCode) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const permission = await getPermission(name);
    if (!req.userInfo) {
      res.status(401).json({ error: 'This endpoint requires authorisation' });
      return;
    }
    const userPerms = await getUserPermissions(req.userInfo.userPublicId);

    if (!userPerms.has(permission.name)) {
      res.status(403).json({
        error: `Access denied (missing permission: ${permission.name})`,
      });
      return;
    }
    return next();
  };
};
