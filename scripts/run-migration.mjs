// Run migration 0010 against hosted Supabase
import fs from "fs";
import pg from "pg";

const envContent = fs.readFileSync(".env.local", "utf-8");
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
const projectRef = supabaseUrl?.replace("https://", "")?.split(".")[0];
const dbPassword = envContent.match(/SUPABASE_DB_PASSWORD=(.+)/)?.[1]?.trim();

console.log("Project ref:", projectRef);
console.log("Password present:", !!dbPassword);

const encodedPass = encodeURIComponent(dbPassword);
const connectionString = `postgresql://postgres:${encodedPass}@db.${projectRef}.supabase.co:5432/postgres`;

console.log("Connecting to:", connectionString.replace(encodedPass, "***"));

const { Client } = pg;
const client = new Client({
  connectionString,
  connectionTimeoutMillis: 15000,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected to Supabase database");

  const sql = fs.readFileSync("supabase/migrations/0010_leads_module.sql", "utf-8");
  console.log("Migration file size:", sql.length, "chars");

  await client.query(sql);
  console.log("Migration 0010 applied successfully!");
} catch (err) {
  console.error("Migration failed:", err.message);
  if (err.position) {
    const sql = fs.readFileSync("supabase/migrations/0010_leads_module.sql", "utf-8");
    const pos = parseInt(err.position);
    console.error("Error at position:", pos);
    console.error("Context:", sql.substring(Math.max(0, pos - 100), pos + 100));
  }
} finally {
  await client.end();
}
