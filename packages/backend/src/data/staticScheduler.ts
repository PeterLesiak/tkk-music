import type { PoolConnection } from 'mariadb';
import { getPool } from './db.js';
import type { SelfInfo } from './users.js';
import assert from 'node:assert';

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
  updatedByUser?: SelfInfo; // sensitive
  createdAt: Date;
  updatedAt: Date;
};

// TODO: all redis cached!!1!

export const getStaticSchedule = async (): Promise<StaticScheduleBlock[]> => {
  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();
    const result = await connection.query<StaticScheduleBlockDbRecord[]>(
      'select static_schedule_block_id, day_of_week, start_time, end_time, label, description, genre_id, is_active, updated_by_user_id, created_at, updated_at from static_schedule_blocks;',
    );
    return result.map(row => {
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
    });
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
      'select static_schedule_block_id, day_of_week, start_time, end_time, label, description, genre_id, is_active, updated_by_user_id, created_at, updated_at from static_schedule_blocks where static_schedule_block_id = ?;',
      [id],
    );
    if (result.length === 0) return null;

    assert(result.length === 1);

    const row = result[0]!;
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
  } finally {
    if (connection) connection.release();
  }
};
export const updateStaticScheduleById = async ({
  id,
  startTime,
  endTime,
  label,
  description,
  isActive,
  updatedByUser,
}: StaticScheduleBlock): Promise<boolean> => {
  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();
    await connection.beginTransaction();
    // TODO: extract; audit log
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
    await connection.commit();
    return !!result.affectedRows;
  } finally {
    if (connection) connection.release();
  }
};
export const deleteStaticScheduleById = async ({
  id,
}: StaticScheduleBlock): Promise<boolean> => {
  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();
    await connection.beginTransaction();
    // TODO: extract; audit log
    const result = await connection.query(
      'delete from static_schedule_blocks where static_schedule_block_id = ?;',
      [id],
    );
    await connection.commit();
    return !!result.affectedRows;
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
) => {
  const dayOfWeekIndex = daysOfWeek.indexOf(weekday);
  await connection.query(
    'insert into static_schedule_blocks (day_of_week, start_time, end_time, label, description, updated_by_user_id) values (?, ?, ?, ?, ?, ?);',
    [dayOfWeekIndex, startTime, endTime, label, description, actorId],
  );
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
    const count = result[0]['count(*)'];
    return count !== 0n;
    // TODO: audit log!!
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
) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();

    await connection.beginTransaction();
    await insertScheduleEntry(
      connection,
      weekday,
      startTime,
      endTime,
      label,
      actorId,
      description,
    );
    // TODO: audit log!!
    await connection.commit();
  } finally {
    if (connection) connection.release();
  }
};

export const daysOfWeek = days;

export const parseInputTime = (raw?: string): TimeOnly | null => {
  // format: hh:mm(:ss)
  if (!raw) return null;

  const split = raw.split(':');
  if (split.length === 2) {
    const hour = parseInt(split[0]!);
    const minute = parseInt(split[1]!);
    if (hour < 0 || hour >= 24) return null;
    if (minute < 0 || minute >= 60) return null;

    if (isNaN(hour) || isNaN(minute)) return null;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
  } else if (split.length === 3) {
    const hour = parseInt(split[0]!);
    const minute = parseInt(split[1]!);
    const second = parseInt(split[2]!);
    if (hour < 0 || hour >= 24) return null;
    if (minute < 0 || minute >= 60) return null;
    if (second < 0 || second >= 60) return null;

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  }
  return null;
};
