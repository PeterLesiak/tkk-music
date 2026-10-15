import type { PoolConnection } from 'mariadb';
import { getPool, type InsertRow } from './db.js';
import type { SelfInfo } from './users.js';
import assert from 'node:assert';
import { writeAuditLog, type AuditContext } from './auditlog.js';

type TimeOnly = `${string}:${string}:${string}`;

export interface StaticScheduleBlockDbRecord {
  static_schedule_block_id: number;
  day_of_week: number; // indexed from 0
  start_time: TimeOnly;
  end_time: TimeOnly;
  label: string;
  description: string;
  genre_id?: number; // maybe used in the future? Generally meant to provide a possible "extension" of dictating a specific music genre for the given day
  is_active: boolean;
  updated_by_user_id?: number;
  created_at: Date;
  updated_at: Date;
}

const days: [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
export const daysOfWeek = days;

type Extract<T> = T extends (infer U)[] ? U : T;
export type WeekDay = Extract<typeof days>;
type Genre = {};
export type StaticScheduleBlock = {
  id: number;
  dayOfWeek: WeekDay;
  startTime: TimeOnly;
  endTime: TimeOnly;
  label: string;
  description: string;
  genre: Genre;
  isActive: boolean;
  updatedByUser?: SelfInfo;
  createdAt: Date;
  updatedAt: Date;
};

const SELECT_COLUMNS =
  'static_schedule_block_id, day_of_week, start_time, end_time, label, description, genre_id, is_active, updated_by_user_id, created_at, updated_at';

const toBlock = (row: StaticScheduleBlockDbRecord): StaticScheduleBlock => {
  assert(row.day_of_week < days.length);
  return {
    id: row.static_schedule_block_id,
    dayOfWeek: days[row.day_of_week] as WeekDay,
    startTime: row.start_time,
    endTime: row.end_time,
    label: row.label,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    genre: {},
  } satisfies StaticScheduleBlock;
};

type AuditSnapshotRow = Pick<
  StaticScheduleBlockDbRecord,
  | 'day_of_week'
  | 'start_time'
  | 'end_time'
  | 'label'
  | 'description'
  | 'is_active'
>;
const snapshot = (row: AuditSnapshotRow) => ({
  dayOfWeek: days[row.day_of_week],
  startTime: row.start_time,
  endTime: row.end_time,
  label: row.label,
  description: row.description,
  isActive: Boolean(row.is_active),
});
const SNAPSHOT_SQL =
  'select day_of_week, start_time, end_time, label, description, is_active from static_schedule_blocks where static_schedule_block_id = ? for update;';

// TODO: all redis cached!!1!

export const getStaticSchedule = async (): Promise<StaticScheduleBlock[]> => {
  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();
    const result = await connection.query<StaticScheduleBlockDbRecord[]>(
      `select ${SELECT_COLUMNS} from static_schedule_blocks;`,
    );
    return result.map(toBlock);
  } finally {
    if (connection) connection.release();
  }
};

export const getStaticScheduleBiId = async (
  id: number,
): Promise<StaticScheduleBlock | null> => {
  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();
    const result = await connection.query<StaticScheduleBlockDbRecord[]>(
      `select ${SELECT_COLUMNS} from static_schedule_blocks where static_schedule_block_id = ?;`,
      [id],
    );
    if (result.length === 0) return null;

    assert(result.length === 1);
    return toBlock(result[0]!);
  } finally {
    if (connection) connection.release();
  }
};

export const updateStaticScheduleById = async (
  {
    id,
    startTime,
    endTime,
    label,
    description,
    isActive,
    updatedByUser,
  }: StaticScheduleBlock,
  ctx: AuditContext = {},
): Promise<boolean> => {
  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();
    await connection.beginTransaction();

    const before = await connection.query<AuditSnapshotRow[]>(SNAPSHOT_SQL, [
      id,
    ]);
    if (before.length === 0) {
      await connection.rollback();
      return false;
    }
    const oldValue = snapshot(before[0]!);

    const result = await connection.query(
      'update static_schedule_blocks set start_time=?, end_time=?, label=?, description=?, is_active=?, updated_by_user_id=? where static_schedule_block_id = ?;',
      [
        startTime,
        endTime,
        label,
        description,
        isActive,
        updatedByUser?.databaseId,
        id,
      ],
    );
    const updated = !!result.affectedRows;
    if (updated) {
      await writeAuditLog(
        {
          action: 'schedule.static.update',
          actorUserId: updatedByUser?.databaseId,
          targetType: 'static_schedule_block',
          targetId: id,
          oldValue,
          newValue: {
            dayOfWeek: oldValue.dayOfWeek,
            startTime,
            endTime,
            label,
            description,
            isActive,
          },
          ...ctx,
        },
        connection,
      );
    }
    await connection.commit();
    return updated;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const deleteStaticScheduleById = async (
  id: number,
  actorId: number,
  ctx: AuditContext = {},
): Promise<boolean> => {
  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();
    await connection.beginTransaction();

    const before = await connection.query<AuditSnapshotRow[]>(SNAPSHOT_SQL, [
      id,
    ]);
    if (before.length === 0) {
      await connection.rollback();
      return false;
    }

    const result = await connection.query(
      'delete from static_schedule_blocks where static_schedule_block_id = ?;',
      [id],
    );
    const deleted = !!result.affectedRows;
    if (deleted) {
      await writeAuditLog(
        {
          action: 'schedule.static.delete',
          actorUserId: actorId,
          targetType: 'static_schedule_block',
          targetId: id,
          oldValue: snapshot(before[0]!),
          ...ctx,
        },
        connection,
      );
    }
    await connection.commit();
    return deleted;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

const insertScheduleEntry = async (
  connection: PoolConnection,
  weekday: WeekDay,
  startTime: TimeOnly,
  endTime: TimeOnly,
  label: string,
  actorId: number,
  description?: string,
): Promise<number> => {
  const dayOfWeekIndex = daysOfWeek.indexOf(weekday);
  const { insertId } = await connection.query<InsertRow>(
    'insert into static_schedule_blocks (day_of_week, start_time, end_time, label, description, updated_by_user_id) values (?, ?, ?, ?, ?, ?);',
    [dayOfWeekIndex, startTime, endTime, label, description ?? null, actorId],
  );
  return Number(insertId);
};

export const checkStaticEntryExists = async (
  weekday: WeekDay,
  startTime: TimeOnly,
) => {
  let connection: PoolConnection | null = null;
  const dayOfWeekIndex = daysOfWeek.indexOf(weekday);

  try {
    connection = await getPool().getConnection();

    const result = await connection.query(
      'select count(*) from static_schedule_blocks where day_of_week = ? and start_time = ?',
      [dayOfWeekIndex, startTime],
    );
    return Number(result[0]['count(*)']) !== 0;
  } finally {
    if (connection) connection.release();
  }
};

export const createStaticScheduleEntry = async (
  weekday: WeekDay,
  startTime: TimeOnly,
  endTime: TimeOnly,
  label: string,
  actorId: number,
  description?: string,
  ctx: AuditContext = {},
) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();

    await connection.beginTransaction();
    const newId = await insertScheduleEntry(
      connection,
      weekday,
      startTime,
      endTime,
      label,
      actorId,
      description,
    );
    await writeAuditLog(
      {
        action: 'schedule.static.create',
        actorUserId: actorId,
        targetType: 'static_schedule_block',
        targetId: newId,
        newValue: {
          dayOfWeek: weekday,
          startTime,
          endTime,
          label,
          description: description ?? null,
        },
        ...ctx,
      },
      connection,
    );
    await connection.commit();
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const parseInputTime = (raw?: string): TimeOnly | null => {
  // format: hh:mm(:ss)
  if (!raw) return null;

  const split = raw.split(':');
  if (split.length === 2) {
    const hour = parseInt(split[0]!);
    const minute = parseInt(split[1]!);
    if (isNaN(hour) || isNaN(minute)) return null;
    if (hour < 0 || hour >= 24) return null;
    if (minute < 0 || minute >= 60) return null;

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
  } else if (split.length === 3) {
    const hour = parseInt(split[0]!);
    const minute = parseInt(split[1]!);
    const second = parseInt(split[2]!);
    if (isNaN(hour) || isNaN(minute) || isNaN(second)) return null;
    if (hour < 0 || hour >= 24) return null;
    if (minute < 0 || minute >= 60) return null;
    if (second < 0 || second >= 60) return null;

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  }
  return null;
};
