import { Client } from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationFile = join(__dirname, "..", "supabase", "migrations", "0006_fix_rls_recursion.sql");

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

  const sql = readFileSync(migrationFile, "utf8");
  console.log("Running migration: 0006_fix_rls_recursion.sql");
  try {
    await client.query(sql);
    console.log("  ✓ Success\n");
  } catch (err) {
    console.error(`  ✗ Error: ${err.message}\n`);
    throw err;
  }

  await client.end();
  console.log("Migration applied successfully!");
}

run().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
