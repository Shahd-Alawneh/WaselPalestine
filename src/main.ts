import app from "./app";
import pool from "./db/mysql";
import dotenv from "dotenv";
<<<<<<< HEAD
import "./db/redis";
import reportsRoutes from "./modules/reports/reports.routes";
=======
>>>>>>> origin/main
dotenv.config();

const PORT = process.env.PORT || 5000;

<<<<<<< HEAD
const DB_CONNECT_RETRIES = 15;
const DB_RETRY_DELAY_MS = 2000;

async function waitForDatabase() {
  let lastError: unknown;

  for (let attempt = 1; attempt <= DB_CONNECT_RETRIES; attempt++) {
    try {
      const [rows] = await pool.query("SELECT 1 AS ok");
      console.log(" DB Connected:", rows);
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        ` Database not ready (attempt ${attempt}/${DB_CONNECT_RETRIES}), retrying in ${
          DB_RETRY_DELAY_MS / 1000
        }s...`,
      );
      await new Promise((resolve) => setTimeout(resolve, DB_RETRY_DELAY_MS));
    }
  }

  throw lastError;
}

async function start() {
  await waitForDatabase();
  app.use("/api/v1/reports", reportsRoutes);
=======
async function start() {
  const [rows] = await pool.query("SELECT 1 AS ok");
  console.log(" DB Connected:", rows);

>>>>>>> origin/main
  app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error(" Failed to start:", err);
  process.exit(1);
});
