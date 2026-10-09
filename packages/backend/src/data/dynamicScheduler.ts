import type { PoolConnection } from 'mariadb';
import { getPool } from './db.js';
import assert from 'node:assert';
import {
  daysOfWeek,
  type StaticScheduleBlock,
  type StaticScheduleBlockDbRecord,
  type WeekDay,
} from './staticScheduler.js';

interface DynamicScheduleBlockDbRecord {
  dynamic_schedule_entry_id: number;
  static_schedule_block_id: number;
  schedule_date: Date;
  dynamic_schedule_entry_status_id: number;
  updated_by_user_id?: number;
  updated_by_actor_type_id: number;
  created_at: Date;
  updated_at: Date;
}
interface DynamicScheduleEntryStatusDbRecord {
  dynamic_schedule_entry_status_id: number;
  status_code: string;
}
type DbRecord = DynamicScheduleBlockDbRecord &
  DynamicScheduleEntryStatusDbRecord &
  StaticScheduleBlockDbRecord;
type Status = {
  id: number;
  code: string;
};
type DynamicScheduleBlock = {
  id: number;
  staticScheduleBlock: StaticScheduleBlock;
  scheduleDate: Date;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
};

// TODO: all redis cached!!1!

export const getDynamicSchedule = async (): Promise<DynamicScheduleBlock[]> => {
  let connection: PoolConnection | null = null;
  try {
    connection = await getPool().getConnection();
    const result = await connection.query<DbRecord[]>(
      'select dynamic_schedule_entries.static_schedule_block_id, day_of_week, start_time, end_time, label, description, genre_id, is_active, dynamic_schedule_entries.updated_by_user_id as dynamic_updated_by_user_id, dynamic_schedule_entries.created_at as dynamic_created_at, static_schedule_blocks.created_at as static_created_at, dynamic_schedule_entries.updated_at as dynamic_updated, static_schedule_blocks.updated_at as static_updated from dynamic_schedule_entries join static_schedule_blocks on static_schedule_blocks.static_schedule_block_id = dynamic_schedule_entries.static_schedule_block_id;',
    );
    return result.map(row => {
      assert(row.day_of_week < daysOfWeek.length);
      return {
        id: row.dynamic_schedule_entry_id,
        scheduleDate: row.schedule_date,
        status: {
          id: row.dynamic_schedule_entry_status_id,
          code: row.status_code,
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        staticScheduleBlock: {
          id: row.static_schedule_block_id,
          dayOfWeek: daysOfWeek[row.day_of_week] as WeekDay,
          startTime: row.start_time,
          endTime: row.end_time,
          label: row.label,
          description: row.description,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          genre: {},
        },
      } satisfies DynamicScheduleBlock;
    });
  } finally {
    if (connection) connection.release();
  }
};
