import { Client } from "pg";

const connectionString =
  "postgresql://postgres.dpzcnokaihewwirlvysq:Groot%4022122212@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function check() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const tables = [
    "profiles", "customers", "leads", "deals", "properties",
    "property_owners", "invoices", "quotations", "expenses",
    "cheques", "approvals", "documents",
  ];

  for (const t of tables) {
    try {
      const r = await client.query(
        `SELECT count(*) as cnt FROM ${t} WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'`
      );
      if (Number(r.rows[0].cnt) > 0) {
        console.log(`${t}: ${r.rows[0].cnt} non-v4 UUIDs`);
        const sample = await client.query(
          `SELECT id FROM ${t} WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' LIMIT 3`
        );
        sample.rows.forEach((row) => console.log(`  ${row.id}`));
      }
    } catch (e) {
      // table might not have id column or might not exist
    }
  }

  await client.end();
}

check().catch(console.error);
