// Verify migration tables exist
import fs from "fs";
import pg from "pg";

const envContent = fs.readFileSync(".env.local", "utf-8");
const projectRef = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim().replace("https://", "").split(".")[0];
const dbPassword = envContent.match(/SUPABASE_DB_PASSWORD=(.+)/)?.[1]?.trim();
const encodedPass = encodeURIComponent(dbPassword);
const connectionString = `postgresql://postgres:${encodedPass}@db.${projectRef}.supabase.co:5432/postgres`;

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

const tables = [
  "lead_stages", "communities", "teams", "team_members", "lead_sources",
  "web_forms", "custom_field_defs", "lead_doc_requirements", "routing_rules",
  "lost_reasons", "campaigns", "form_submissions", "import_batches",
  "saved_filters", "rate_limits", "lead_events", "lead_assignments",
  "lead_viewings", "lead_tasks"
];

for (const t of tables) {
  const r = await client.query(`select count(*) from public.${t}`);
  console.log(`${t}: ${r.rows[0].count} rows`);
}

// Check leads table new columns
const cols = await client.query(`
  select column_name from information_schema.columns
  where table_name = 'leads' and table_schema = 'public'
  and column_name in ('stage_id','custom','campaign_id','phone_norm','email_norm',
    'language','financing','timeframe','purpose','bedrooms','category',
    'no_show_count','first_response_due_at','first_responded_at',
    'last_activity_at','last_inquiry_at','import_batch_id','merged_into_id',
    'tags','pipeline_id','lost_reason','junk_reason','source_id','external_ref')
  order by column_name
`);
console.log("\nNew leads columns:", cols.rows.map(r => r.column_name).join(", "));

// Check leads with stage_id
const staged = await client.query(`select count(*) from public.leads where stage_id is not null`);
console.log("Leads with stage_id:", staged.rows[0].count);

await client.end();
