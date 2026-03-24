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
  const noBom = sql.replace(/^\uFEFF/, "");

  const withoutLineComments = noBom
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("--")) return "";
      return line;
    })
    .join("\n");

  const withoutComments = withoutLineComments.replace(/\/\*[\s\S]*?\*\//g, "");

  return withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function resolveMigrationsDir(): string {
  const candidates = [
    path.join(process.cwd(), "src", "db", "migrations"),
    path.join(process.cwd(), "dist", "db", "migrations"),
    path.join(__dirname, "..", "db", "migrations")
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  throw new Error(
    `Migrations directory not found. Checked: ${candidates.join(", ")}`
  );
}

async function run() {
  await ensureMigrationsTable();

  const dir = resolveMigrationsDir();

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

    for (const stmt of statements) {
      await pool.query(stmt);
    }

    await recordMigration(file);
    console.log(`✅ Applied ${file}`);
  }

  await pool.end();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("❌ Migration failed:", err);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});