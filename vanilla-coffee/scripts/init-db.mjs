// Applies the initial Prisma migration directly with better-sqlite3.
//
// Why this exists: on some Windows machines a security policy (WDAC / Smart
// App Control) blocks Prisma's native schema-engine binary from running at
// all ("Uma politica de Controle de Aplicativo bloqueou este arquivo"), so
// `prisma migrate dev` / `db push` cannot be used locally. This script
// applies prisma/migrations/*/migration.sql directly through the
// better-sqlite3 driver (a native Node addon loaded in-process, not a
// spawned executable, so it isn't affected) and records the migration in
// `_prisma_migrations` so the database stays consistent with what
// `prisma migrate deploy` would have done on a machine without that
// restriction (e.g. Vercel's Linux build).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const migrationsDir = path.join(root, "prisma", "migrations");
const dbPath = path.join(root, "prisma", "dev.db");

mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
  );
`);

const alreadyApplied = new Set(
  db
    .prepare(`SELECT migration_name FROM "_prisma_migrations"`)
    .all()
    .map((r) => r.migration_name)
);

const folders = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const folder of folders) {
  if (alreadyApplied.has(folder)) {
    console.log(`- skip ${folder} (already applied)`);
    continue;
  }
  const sqlPath = path.join(migrationsDir, folder, "migration.sql");
  if (!existsSync(sqlPath)) continue;
  const sql = readFileSync(sqlPath, "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");

  console.log(`- applying ${folder}`);
  db.exec("BEGIN");
  try {
    db.exec(sql);
    db.prepare(
      `INSERT INTO "_prisma_migrations"
        (id, checksum, finished_at, migration_name, applied_steps_count, started_at)
       VALUES (?, ?, current_timestamp, ?, 1, current_timestamp)`
    ).run(crypto.randomUUID(), checksum, folder);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

db.close();
console.log("Database is up to date:", dbPath);
