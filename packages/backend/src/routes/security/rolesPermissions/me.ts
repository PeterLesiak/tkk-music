import { Router } from 'express';
import {
  requireBearerToken,
  requireValidSession,
} from '../../../middlewares/auth.js';
import assert from 'assert';
import { getUserPermissions, getUserRoles } from '../../../data/permissions.js';

const router = Router();

router.get(
  '/permissions',
  requireBearerToken,
  requireValidSession,
  async (req, res) => {
    const me = req.userInfo;
    assert(me);
    const permissions = await getUserPermissions(me.userPublicId);
    res.json(permissions.values().toArray());
  },
);

router.get(
  '/roles',
  requireBearerToken,
  requireValidSession,
  async (req, res) => {
    const me = req.userInfo;
    assert(me);
    const roles = await getUserRoles(me.userPublicId);
    res.json(roles);
  },
);

export const meRouter = router;
