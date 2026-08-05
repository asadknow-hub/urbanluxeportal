import { Client } from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
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

  console.log("Running seed data (statement by statement)...");
  const seedSql = readFileSync(seedFile, "utf8");

  // Split by semicolons followed by newline
  const statements = seedSql
    .split(/;\s*\n/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    // Skip pure comment blocks
    const lines = stmt.split("\n").filter((l) => !l.trim().startsWith("--"));
    const code = lines.join("\n").trim();
    if (!code) continue;

    try {
      await client.query(code + ";");
      success++;
    } catch (err) {
      console.error(`✗ Statement ${i + 1} failed: ${err.message}`);
      console.error(`  Preview: ${code.substring(0, 80)}...`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed`);

  await client.end();
  console.log("Seed data applied successfully!");
}

run().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
