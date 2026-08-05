import { Client } from "pg";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");
const seedFile = join(__dirname, "..", "supabase", "seed.sql");

const connectionString =
  "postgresql://postgres.dpzcnokaihewwirlvysq:Groot%4022122212@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connecting to Supabase...");
  await client.connect();
  console.log("Connected!\n");

  // Run migrations in order
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const path = join(migrationsDir, file);
    const sql = readFileSync(path, "utf8");
    console.log(`Running migration: ${file}`);
    try {
      await client.query(sql);
      console.log(`  ✓ Success\n`);
    } catch (err) {
      console.error(`  ✗ Error in ${file}: ${err.message}\n`);
      throw err;
    }
  }

  // Run seed
  console.log("Running seed data...");
  const seedSql = readFileSync(seedFile, "utf8");
  try {
    await client.query(seedSql);
    console.log("  ✓ Seed data inserted\n");
  } catch (err) {
    console.error(`  ✗ Seed error: ${err.message}\n`);
    throw err;
  }

  await client.end();
  console.log("All migrations and seed data applied successfully!");
}

run().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
