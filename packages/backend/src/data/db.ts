import { createPool, type Pool, type PoolConfig } from "mariadb";
import assert from "node:assert";

let pool: Pool | null = null;

export const initialiseDbPool = (config: PoolConfig): void => {
     pool = createPool(config);
};

export const getPool = (): Pool => {
     assert(pool, "pool must be initialised!");
     return pool;
};

export type InsertRow = {
     insertId: number;
     affectedRows: number;
};
