import type { PoolConnection } from 'mariadb';
import { getPool } from '../data/db.js';
import assert from 'node:assert';
import type { MakePath } from '../util/types.js';

interface PermissionCategoryDbRecord {
  permission_category_id: number;
  category_code: string;
}

interface PermissionDbRecord {
  permission_id: number;
  permission_code: string;
  permission_category_id: number;
}

interface RoleDbRecord {
  role_id: number;
  role_code: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  created_at: Date;
}

type Role = {
  id: number;
  code: string;
  displayName: string;
  description?: string | undefined;
  isSystemRole: boolean;
  createdAt: Date;
};

type JointDbRecord = PermissionCategoryDbRecord & PermissionDbRecord;
type PermissionCategory = {
  id: number;
  name: string;
};

interface PermissionSchema {
  music: {
    artists: 'manage';
    audio_files: 'manage';
    songs: 'create' | 'delete' | 'edit' | 'view';
  };
  permissions: {
    roles: 'manage';
  };
  queue: 'view' | 'manage';
  scheduling: {
    static: 'view' | 'manage';
    dynamic: 'view' | 'manage';
  };
  system: {
    audit_log: 'view';
  };
  users: 'manage' | 'view';
}

export type PermissionCode = MakePath<PermissionSchema>;
type Permission = {
  id: number;
  name: PermissionCode;
  category: PermissionCategory;
};

let permissionMapCache: Map<string, Permission> = new Map();

export const getPermission = async (
  name: PermissionCode,
): Promise<Permission> => {
  if (permissionMapCache.has(name)) return permissionMapCache.get(name)!;

  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();

    const result = await connection.query<JointDbRecord[]>(
      'SELECT permission_id, permission_code, permissions.permission_category_id as permission_category_id, category_code FROM permissions JOIN permission_categories ON permission_categories.permission_category_id = permissions.permission_category_id WHERE permission_code = ?;',
      [name],
    );
    assert(result?.length === 1);
    const row = result[0]!;
    const permission = {
      name,
      id: row.permission_id,
      category: {
        id: row.permission_category_id,
        name: row.category_code,
      },
    } satisfies Permission;
    permissionMapCache.set(name, permission);
    return permission;
  } finally {
    if (connection) connection.release();
  }
};

export const getUserPermissions = async (publicId: string) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();

    const result = await connection.query<JointDbRecord[]>(
      'select permissions.permission_id as permission_id, permission_code, permissions.permission_category_id as permission_category_id, category_code from user_roles join role_permissions on role_permissions.role_id = user_roles.role_id join permissions on permissions.permission_id = role_permissions.permission_id join permission_categories on permission_categories.permission_category_id = permissions.permission_category_id where user_roles.role_id = (select user_id from users where public_id = UNHEX(?));',
      [publicId],
    );
    let permissions: Map<string, Permission> = new Map();
    for (const row of result) {
      const permission = {
        name: row.permission_code as PermissionCode,
        id: row.permission_id,
        category: {
          id: row.permission_category_id,
          name: row.category_code,
        },
      } satisfies Permission;
      permissionMapCache.set(permission.name, permission);
      permissions.set(permission.name, permission);
    }
    return permissions;
  } finally {
    if (connection) connection.release();
  }
};
export const getUserRoles = async (
  publicId: string,
): Promise<Role[] | null> => {
  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();

    const result = await connection.query<RoleDbRecord[]>(
      'select user_roles.role_id, role_code, display_name, description, is_system_role, created_at from user_roles join roles on roles.role_id = user_roles.role_id where user_roles.role_id = (select user_id from users where public_id = UNHEX(?));',
      [publicId],
    );
    const roles: Role[] = [];
    for (const row of result) {
      roles.push({
        id: row.role_id,
        code: row.role_code,
        displayName: row.display_name,
        description: row.description,
        isSystemRole: !!row.is_system_role,
        createdAt: row.created_at,
      } satisfies Role);
    }
    return roles;
  } finally {
    if (connection) connection.release();
  }
};
