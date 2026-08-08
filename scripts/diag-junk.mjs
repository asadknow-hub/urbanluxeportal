import { Client } from "pg";

const connectionString =
  "postgresql://postgres.dpzcnokaihewwirlvysq:Groot%4022122212@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function diag() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const { rows: stages } = await client.query(
    "SELECT name, kind, required_fields FROM lead_stages WHERE kind IN ('junk','lost')"
  );
  console.log("Junk/Lost stages:", JSON.stringify(stages, null, 2));

  const { rows: reasons } = await client.query(
    "SELECT kind, label FROM lost_reasons ORDER BY kind, sort"
  );
  console.log("\nReasons:", JSON.stringify(reasons, null, 2));

  await client.end();
}

diag().catch(console.error);
