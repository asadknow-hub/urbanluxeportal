import { Client } from "pg";

const connectionString =
  "postgresql://postgres.dpzcnokaihewwirlvysq:Groot%4022122212@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function diag() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Check if has_role function exists
  const { rows: funcs } = await client.query(
    "SELECT proname, prosrc FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace"
  );
  console.log("has_role function:", funcs.length > 0 ? funcs[0].prosrc : "NOT FOUND");

  // Test has_role as admin
  const { rows: profiles } = await client.query(
    "SELECT id, email, role FROM profiles WHERE is_active = true LIMIT 3"
  );
  for (const p of profiles) {
    try {
      await client.query(`SET LOCAL role TO 'authenticated'`);
      await client.query(`SET LOCAL request.jwt.claims TO '${JSON.stringify({ sub: p.id, role: "authenticated" })}'`);
      const { rows } = await client.query(`SELECT public.has_role(array['admin','manager']) as is_mgmt`);
      console.log(`  ${p.email} (${p.role}): has_role=['admin','manager'] = ${rows[0].is_mgmt}`);
      await client.query(`RESET ROLE`);
    } catch (e) {
      console.log(`  ${p.email} (${p.role}): error = ${e.message}`);
      await client.query(`RESET ROLE`);
    }
  }

  // Check leads_update policy details
  const { rows: policies } = await client.query(
    "SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'leads' AND policyname LIKE '%update%'"
  );
  console.log("\nLeads update policies:");
  policies.forEach(p => {
    console.log(`  ${p.policyname} (${p.cmd}): qual=${p.qual}`);
    console.log(`    with_check=${p.with_check}`);
  });

  await client.end();
}

diag().catch(console.error);
