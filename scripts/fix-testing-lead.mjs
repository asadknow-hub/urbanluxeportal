import { Client } from "pg";

const connectionString =
  "postgresql://postgres.dpzcnokaihewwirlvysq:Groot%4022122212@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function fix() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const { rows } = await client.query(
    "UPDATE leads SET stage_id = '58d8105c-e7b4-45c4-ba4e-16bbe9fb6798' WHERE name = $1 AND stage_id = 'd10ead8c-4a8e-4d6d-87fd-34712f8cb4a8' RETURNING id, name, stage_id",
    ["testing 1"]
  );
  console.log("Fixed:", JSON.stringify(rows, null, 2));

  await client.end();
}

fix().catch(console.error);
