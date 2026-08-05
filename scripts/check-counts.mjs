import { Client } from "pg";

const connectionString =
  "postgresql://postgres.dpzcnokaihewwirlvysq:Groot%4022122212@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const tables = ["profiles", "company_settings", "property_owners", "properties", "customers", "leads", "deals", "quotations", "invoices", "cheques", "payments", "activity_log", "documents", "approvals", "notifications", "automation_rules", "email_templates", "counters"];

  for (const t of tables) {
    const res = await client.query(`select count(*) from public.${t}`);
    console.log(`${t}: ${res.rows[0].count} rows`);
  }

  await client.end();
}

run().catch(console.error);
