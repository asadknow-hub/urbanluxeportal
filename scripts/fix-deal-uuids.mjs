import { Client } from "pg";
import { randomUUID } from "crypto";

const connectionString =
  "postgresql://postgres.dpzcnokaihewwirlvysq:Groot%4022122212@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function fix() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Find all deals with non-v4 UUIDs
  const { rows: badDeals } = await client.query(`
    SELECT id, title FROM deals
    WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  `);
  console.log(`Found ${badDeals.length} deals with non-v4 UUIDs:`);
  badDeals.forEach((d) => console.log(`  ${d.id} — ${d.title}`));

  // Fix each one by generating a new v4 UUID and updating all references
  for (const deal of badDeals) {
    const newId = randomUUID();
    console.log(`\nReplacing ${deal.id} → ${newId}`);

    // Update deal_activities
    await client.query("UPDATE deal_activities SET deal_id = $1 WHERE deal_id = $2", [newId, deal.id]);

    // Update invoices
    await client.query("UPDATE invoices SET deal_id = $1 WHERE deal_id = $2", [newId, deal.id]);

    // Update quotations
    await client.query("UPDATE quotations SET deal_id = $1 WHERE deal_id = $2", [newId, deal.id]);

    // Update leads that reference this deal
    await client.query("UPDATE leads SET converted_deal_id = $1 WHERE converted_deal_id = $2", [newId, deal.id]);

    // Update the deal itself
    await client.query("UPDATE deals SET id = $1 WHERE id = $2", [newId, deal.id]);

    console.log(`  Done.`);
  }

  // Verify
  const { rows: remaining } = await client.query(`
    SELECT count(*) as cnt FROM deals
    WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  `);
  console.log(`\nRemaining non-v4 UUIDs: ${remaining[0].cnt}`);

  await client.end();
}

fix().catch(console.error);
