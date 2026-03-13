import fs from "fs";
import path from "path";
import pool from "../db/mysql";

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function hasMigration(name: string): Promise<boolean> {
  const [rows] = await pool.query<any[]>(
    "SELECT 1 FROM migrations WHERE name = ? LIMIT 1",
    [name]
  );
  return rows.length > 0;
}

async function recordMigration(name: string) {
  await pool.query("INSERT INTO migrations (name) VALUES (?)", [name]);
}

/**
 * Splits a SQL file into executable statements.
 * - removes comments
 * - splits by semicolon
 * - ignores empty statements
 */
function splitSqlStatements(sql: string): string[] {
  // Remove BOM if exists
  const noBom = sql.replace(/^\uFEFF/, "");

  // Remove line comments starting with --
  const withoutLineComments = noBom
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("--")) return "";
      return line;
    })
    .join("\n");

  // Remove block comments /* ... */
  const withoutComments = withoutLineComments.replace(/\/\*[\s\S]*?\*\//g, "");

  // Split statements by semicolon
  return withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function run() {
  await ensureMigrationsTable();

  const dir = path.join(process.cwd(), "src", "db", "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const already = await hasMigration(file);
    if (already) {
      console.log(`↩️  Skipping ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(dir, file), "utf-8");
    const statements = splitSqlStatements(sql);

    if (statements.length === 0) {
      console.log(`⚠️  Skipping ${file} (no SQL statements found)`);
      await recordMigration(file);
      continue;
    }

    console.log(`🟡 Applying ${file}...`);

    // Run each statement sequentially
    for (const stmt of statements) {
      await pool.query(stmt);
    }

    await recordMigration(file);
    console.log(`✅ Applied ${file}`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});