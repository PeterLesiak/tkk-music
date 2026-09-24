import express from "express";
import router from "./routes/routes.js";
import { configDotenv } from "dotenv";
import type { PoolConfig } from "mariadb";
import { initialiseDbPool } from "./data/db.js";
import { cleanupExpiredLoginAttempts } from "./data/users.js";

const PORT = 3000;

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
if (password) { config.password = password; } else { console.warn("Please set the password..."); }

if (host) {
     config.host = host;
} else if (socket) {
     config.socketPath = socket;
} else {
     throw "Invalid host";
}
initialiseDbPool(config);

const app = express();

app.use(express.json());
app.use(router);

app.get("/", (req, res) => {
     res.json({
          ok: "ok",
          path: req.path
     });
});

app.listen(PORT, () => {
     console.log(`App listening on port ${PORT}`);
});
cleanupExpiredLoginAttempts();
setInterval(() => { cleanupExpiredLoginAttempts().catch(console.error); }, 15 * 60 * 1000);
