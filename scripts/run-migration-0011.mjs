// Run migration 0011 against the Supabase hosted PostgreSQL
import fs from "fs";
import pg from "pg";

const envContent = fs.readFileSync(".env.local", "utf-8");
const projectRef = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim().replace("https://", "").split(".")[0];
const dbPassword = envContent.match(/SUPABASE_DB_PASSWORD=(.+)/)?.[1]?.trim();
const encodedPass = encodeURIComponent(dbPassword);
const connectionString = `postgresql://postgres:${encodedPass}@db.${projectRef}.supabase.co:5432/postgres`;

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

const sql = fs.readFileSync("supabase/migrations/0011_field_config_and_mapping.sql", "utf-8");

try {
  await client.query(sql);
  console.log("Migration 0011 applied successfully!");
} catch (err) {
  console.error("Migration error:", err.message);
  // Try running statements individually for better error reporting
  const statements = sql.split(/;(?=\s*(?:--|create|alter|drop|grant|comment|do|\s))/i).filter(s => s.trim());
  for (const stmt of statements) {
    try {
      await client.query(stmt);
      console.log("OK:", stmt.trim().substring(0, 80).replace(/\n/g, " "));
    } catch (e) {
      console.error("FAIL:", e.message, "| Statement:", stmt.trim().substring(0, 80).replace(/\n/g, " "));
    }
  }
}

// Verify
const { rows: cols1 } = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'lead_sources' AND column_name IN ('field_mapping', 'updated_at')");
console.log("lead_sources new columns:", cols1.map(c => c.column_name));

const { rows: cols2 } = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'custom_field_defs' AND column_name IN ('updated_at', 'deleted_at')");
console.log("custom_field_defs new columns:", cols2.map(c => c.column_name));

const { rows: triggers } = await client.query("SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE '%updated_at%'");
console.log("Triggers:", triggers.map(t => t.trigger_name));

await client.end();
