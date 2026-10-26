import type { PoolConnection } from 'mariadb';
import { getPool } from './db.js';

export type AuditActionCode =
  | 'auth.register'
  | 'auth.login.start'
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.login.mfa_required'
  | 'auth.logout'
  | 'auth.refresh_token_reuse'
  | 'permission.denied'
  | 'role.assign'
  | 'role.revoke'
  | 'role.permission.grant'
  | 'role.permission.revoke'
  | 'schedule.static.create'
  | 'schedule.static.update'
  | 'schedule.static.delete';

export type AuditActorCode = 'user' | 'system' | 'admin';

export type AuditContext = {
  ip?: string | undefined;
  userAgent?: string | undefined;
};

export interface AuditEntryInput {
  action: AuditActionCode;
  actorType?: AuditActorCode | undefined;
  actorUserId?: number | null | undefined;
  targetType?: string | undefined;
  targetId?: string | number | undefined;
  success?: boolean | undefined;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string | undefined;
  userAgent?: string | undefined;
}

export type AuditLogEntry = {
  id: number;
  action: string;
  actorType: string;
  actorUserPublicId: string | null;
  targetType: string | null;
  targetId: string | null;
  success: boolean;
  oldValue: unknown;
  newValue: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export interface AuditLogFilters {
  actorPublicId?: string | undefined;
  action?: string | undefined;
  targetType?: string | undefined;
  targetId?: string | undefined;
  success?: boolean | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
  before?: number | undefined;
  limit?: number | undefined;
}

export const AUDIT_DEFAULT_LIMIT = 50;
export const AUDIT_MAX_LIMIT = 200;

const actionCache = new Map<string, number>();
const actorCache = new Map<string, number>();

const lookupId = async (
  connection: PoolConnection,
  cache: Map<string, number>,
  sql: string,
  idColumn: string,
  code: string,
): Promise<number> => {
  const cached = cache.get(code);
  if (cached !== undefined) return cached;
  const rows = await connection.query<Record<string, number>[]>(sql, [code]);
  if (rows.length !== 1) throw new Error(`Unknown audit lookup code: ${code}`);
  const id = Number(rows[0]![idColumn]);
  cache.set(code, id);
  return id;
};

const jsonOrNull = (value: unknown): string | null =>
  value === undefined ? null : JSON.stringify(value);

export const writeAuditLog = async (
  entry: AuditEntryInput,
  connection?: PoolConnection,
): Promise<void> => {
  const own = connection ?? (await getPool().getConnection());
  try {
    const actionId = await lookupId(
      own,
      actionCache,
      'select audit_action_id from audit_actions where action_code = ?;',
      'audit_action_id',
      entry.action,
    );
    const actorCode: AuditActorCode =
      entry.actorType ?? (entry.actorUserId ? 'user' : 'admin');
    const actorTypeId = await lookupId(
      own,
      actorCache,
      'select actor_type_id from actor_types where actor_type_code = ?;',
      'actor_type_id',
      actorCode,
    );

    await own.query(
      'insert into audit_log (audit_action_id, actor_type_id, actor_user_id, target_type, target_id, success, old_value_json, new_value_json, ip_address, user_agent) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        actionId,
        actorTypeId,
        entry.actorUserId ?? null,
        entry.targetType ?? null,
        entry.targetId !== undefined ? String(entry.targetId) : null,
        entry.success ?? true,
        jsonOrNull(entry.oldValue),
        jsonOrNull(entry.newValue),
        entry.ip ?? null,
        entry.userAgent?.slice(0, 512) ?? null,
      ],
    );
  } finally {
    if (!connection) own.release();
  }
};

export const tryWriteAuditLog = async (
  entry: AuditEntryInput,
  connection?: PoolConnection,
): Promise<void> => {
  try {
    await writeAuditLog(entry, connection);
  } catch (error) {
    console.error('audit log write failed', error);
  }
};

const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value ?? null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const getAuditLog = async (
  filters: AuditLogFilters = {},
): Promise<{ entries: AuditLogEntry[]; nextCursor: number | null }> => {
  const limit = Math.min(
    Math.max(filters.limit ?? AUDIT_DEFAULT_LIMIT, 1),
    AUDIT_MAX_LIMIT,
  );

  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.actorPublicId) {
    where.push('users.public_id = UNHEX(?)');
    params.push(filters.actorPublicId);
  }
  if (filters.action) {
    where.push('audit_actions.action_code = ?');
    params.push(filters.action);
  }
  if (filters.targetType) {
    where.push('audit_log.target_type = ?');
    params.push(filters.targetType);
  }
  if (filters.targetId) {
    where.push('audit_log.target_id = ?');
    params.push(filters.targetId);
  }
  if (filters.success !== undefined) {
    where.push('audit_log.success = ?');
    params.push(filters.success);
  }
  if (filters.from) {
    where.push('audit_log.created_at >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    where.push('audit_log.created_at < ?');
    params.push(filters.to);
  }
  if (filters.before !== undefined) {
    where.push('audit_log.audit_log_id < ?');
    params.push(filters.before);
  }

  const sql = `select audit_log.audit_log_id, audit_actions.action_code, actor_types.actor_type_code, users.public_id as actor_public_id, audit_log.target_type, audit_log.target_id, audit_log.success, audit_log.old_value_json, audit_log.new_value_json, audit_log.ip_address, audit_log.user_agent, audit_log.created_at from audit_log join audit_actions on audit_actions.audit_action_id = audit_log.audit_action_id join actor_types on actor_types.actor_type_id = audit_log.actor_type_id left join users on users.user_id = audit_log.actor_user_id ${
    where.length ? 'where ' + where.join(' and ') : ''
  } order by audit_log.audit_log_id desc limit ?;`;
  params.push(limit + 1);

  const connection = await getPool().getConnection();
  try {
    const rows = await connection.query<
      {
        audit_log_id: number | bigint;
        action_code: string;
        actor_type_code: string;
        actor_public_id: Buffer | null;
        target_type: string | null;
        target_id: string | null;
        success: number | boolean;
        old_value_json: unknown;
        new_value_json: unknown;
        ip_address: string | null;
        user_agent: string | null;
        created_at: Date;
      }[]
    >(sql, params);

    const entries: AuditLogEntry[] = rows.slice(0, limit).map(row => ({
      id: Number(row.audit_log_id),
      action: row.action_code,
      actorType: row.actor_type_code,
      actorUserPublicId: row.actor_public_id
        ? row.actor_public_id.toString('hex')
        : null,
      targetType: row.target_type,
      targetId: row.target_id,
      success: Boolean(row.success),
      oldValue: parseJson(row.old_value_json),
      newValue: parseJson(row.new_value_json),
      ip: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    }));

    return {
      entries,
      nextCursor: rows.length > limit ? entries[entries.length - 1]!.id : null,
    };
  } finally {
    connection.release();
  }
};