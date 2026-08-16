import fs from "fs";
import path from "path";
import pg from "pg";

const envContent = fs.readFileSync(".env.local", "utf-8");
const projectRef = envContent
  .match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]
  ?.trim()
  .replace("https://", "")
  .split(".")[0];
const dbPassword = envContent.match(/SUPABASE_DB_PASSWORD=(.+)/)?.[1]?.trim();
if (!projectRef || !dbPassword) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD in .env.local");
  process.exit(1);
}

const encodedPass = encodeURIComponent(dbPassword);
const urls = [
  `postgresql://postgres.${projectRef}:${encodedPass}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodedPass}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodedPass}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres:${encodedPass}@db.${projectRef}.supabase.co:5432/postgres`,
];

async function connect() {
  for (const connectionString of urls) {
    const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      return client;
    } catch {
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  throw new Error("Could not connect to Postgres. Check pooler region / DB password.");
}

const sql = fs.readFileSync(
  path.join("supabase", "migrations", "0012_drop_custom_fields_add_lead_areas.sql"),
  "utf-8"
);

const client = await connect();
try {
  await client.query(sql);
  await client.query("notify pgrst, 'reload schema'");
  const check = await client.query(
    "select to_regclass('public.lead_areas') as table_name, count(*)::int as n from public.lead_areas"
  );
  console.log("Applied 0012.", check.rows[0]);
} finally {
  await client.end();
}
