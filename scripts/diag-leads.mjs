import { Client } from "pg";

const connectionString =
  "postgresql://postgres.dpzcnokaihewwirlvysq:Groot%4022122212@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function diag() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const { rows: profiles } = await client.query(`
    SELECT id, email, role, is_active FROM public.profiles ORDER BY created_at LIMIT 10
  `);
  console.log("Profiles:");
  profiles.forEach((p) => {
    console.log(`  ${p.email} | role=${p.role} | active=${p.is_active} | id=${p.id}`);
  });

  const { rows: policies } = await client.query(`
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies WHERE tablename = 'leads'
  `);
  console.log("\nRLS policies on leads:");
  policies.forEach((p) => {
    console.log(`  ${p.policyname} (${p.cmd}): qual=${p.qual?.substring(0, 200)}`);
  });

  for (const p of profiles) {
    if (!p.is_active) continue;
    try {
      await client.query(`SET LOCAL role TO 'authenticated'`);
      await client.query(`SET LOCAL request.jwt.claims TO '${JSON.stringify({ sub: p.id, role: "authenticated" })}'`);
      const { rows } = await client.query(`SELECT count(*) as cnt FROM public.leads WHERE deleted_at IS NULL`);
      console.log(`\n  User ${p.email} (${p.role}) can see ${rows[0].cnt} leads`);
      await client.query(`RESET ROLE`);
    } catch (e) {
      console.log(`\n  User ${p.email} (${p.role}) error: ${e.message}`);
      await client.query(`RESET ROLE`);
    }
  }

  console.log("\n--- Testing has_role function ---");
  for (const p of profiles) {
    if (!p.is_active) continue;
    try {
      await client.query(`SET LOCAL role TO 'authenticated'`);
      await client.query(`SET LOCAL request.jwt.claims TO '${JSON.stringify({ sub: p.id, role: "authenticated" })}'`);
      const { rows } = await client.query(`SELECT public.has_role(array['admin','manager','accountant']) as is_mgmt, public.has_role(array['admin']) as is_admin`);
      console.log(`  ${p.email} (${p.role}): has_role=${rows[0].is_mgmt}, is_admin=${rows[0].is_admin}`);
      await client.query(`RESET ROLE`);
    } catch (e) {
      console.log(`  ${p.email} (${p.role}): has_role error: ${e.message}`);
      await client.query(`RESET ROLE`);
    }
  }

  await client.end();
}

diag().catch(console.error);
