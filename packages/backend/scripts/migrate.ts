import { configDotenv } from "dotenv";
import { createPool, type PoolConfig, type PoolConnection } from "mariadb";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

configDotenv();

const host = process.env["DB_HOST"];
const socket = process.env["DB_SOCKET"];
const user = process.env["DB_USER"];
const databaseName = process.env["DB_NAME"];
const password = process.env["DB_PASSWORD"];
if (!user || !databaseName) {
     throw "Invalid credentials";
}

const config: PoolConfig = {
     multipleStatements: true,
     user: user,
     database: databaseName
};
if (password) {config.password = password;} else {console.warn("Please set the password...");}

if (host) {
     config.host = host;
} else if (socket) {
     config.socketPath = socket;
} else {
     throw "Invalid host";
}

const pool = createPool(config);

const migrationsDirectory = path.join(import.meta.dirname, "..", "database");
const migrationFiles = await readdir(migrationsDirectory);
migrationFiles.sort();

type Migration = {
     name: string;
};

const getCompletedMigrations = async (): Promise<Migration[]> => {
     let connection: PoolConnection | null = null;
     try {
          connection = await pool.getConnection();
          await connection.query("create table if not exists schema_migrations (id int primary key auto_increment, name varchar(256) not null, migrationDate timestamp default now());");
          return await connection.query<Migration[]>("select name from schema_migrations");
     } finally {
          if (connection) {connection.release();}
     }
};

try {
     const currentMigrations = await getCompletedMigrations();
     const completedMigrationNames = currentMigrations.map((m: Migration) => m.name);
     console.log("Already applied:", completedMigrationNames);

     await migrationFiles.reduce(async (previous, migrationFile) => {
          await previous;

          if (completedMigrationNames.includes(migrationFile)) {
               console.log(`Skipping completed migration: ${migrationFile}`);
               return;
          }

          const migration = await readFile(path.join(migrationsDirectory, migrationFile), "utf-8");
          console.log(`Applying migration: ${migrationFile}`);

          let connection: PoolConnection | null = null;
          try {
               connection = await pool.getConnection();
               await connection.beginTransaction();
               await connection.query(migration);
               await connection.query("insert into schema_migrations (name) values (?);", [migrationFile]);
               await connection.commit();
               console.log(`Successfully ran: ${migrationFile}`);
          } catch (error) {
               if (connection) {await connection.rollback();}
               console.error(error);
               throw error;
          } finally {
               if (connection) {await connection.release();}
          }
     }, Promise.resolve());
} catch (error) {
     console.error("Migration pipeline aborted due to an error.");
     console.error(error);
     process.exitCode = 1;
} finally {
     await pool.end();
}