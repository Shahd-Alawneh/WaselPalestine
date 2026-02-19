import app from "./app";
import pool from "./db/mysql";

const PORT = process.env.PORT || 5000;

async function start() {
  const [rows] = await pool.query("SELECT 1 AS ok");
  console.log(" DB Connected:", rows);

  app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error(" Failed to start:", err);
  process.exit(1);
});
