import { Client } from "pg";

const connectionString =
  "postgresql://postgres.dpzcnokaihewwirlvysq:Groot%4022122212@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function diag() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Check the "testing 1" lead
  const { rows: leads } = await client.query(
    "SELECT id, name, stage_id, assigned_to, created_by, deleted_at, source, interest FROM leads WHERE name = $1 ORDER BY created_at DESC LIMIT 1",
    ["testing 1"]
  );
  console.log("Lead 'testing 1':", JSON.stringify(leads[0], null, 2));

  // Check the New stage
  const { rows: stages } = await client.query(
    "SELECT id, name, kind FROM lead_stages WHERE name = 'New' AND kind = 'open'"
  );
  console.log("\nNew stage:", JSON.stringify(stages, null, 2));

  // Check triggers on leads
  const { rows: triggers } = await client.query(
    "SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'leads'::regclass AND NOT tgisinternal"
  );
  console.log("\nTriggers on leads:", triggers.map(t => t.tgname).join(", "));

  // Check column default for stage_id
  const { rows: defaults } = await client.query(
    "SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'stage_id'"
  );
  console.log("\nstage_id default:", JSON.stringify(defaults, null, 2));

  // Check all leads count by stage
  const { rows: byStage } = await client.query(
    "SELECT s.name as stage, count(*) as cnt FROM leads l LEFT JOIN lead_stages s ON l.stage_id = s.id WHERE l.deleted_at IS NULL GROUP BY s.name ORDER BY cnt DESC"
  );
  console.log("\nLeads by stage:");
  byStage.forEach(r => console.log(`  ${r.stage ?? "NULL"}: ${r.cnt}`));

  // Check leads with null stage_id
  const { rows: nullStage } = await client.query(
    "SELECT count(*) as cnt FROM leads WHERE stage_id IS NULL AND deleted_at IS NULL"
  );
  console.log(`\nLeads with NULL stage_id: ${nullStage[0].cnt}`);

  await client.end();
}

diag().catch(console.error);
