import { Client } from "pg";

const connectionString =
  "postgresql://postgres.dpzcnokaihewwirlvysq:Groot%4022122212@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function diag() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Check has_role function properties
  const { rows: funcProps } = await client.query(
    `SELECT proname, prosecdef, prorettype::regtype FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace`
  );
  console.log("has_role properties:", JSON.stringify(funcProps));

  // Check profiles RLS
  const { rows: profilePolicies } = await client.query(
    "SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles'"
  );
  console.log("\nProfiles RLS policies:");
  profilePolicies.forEach(p => {
    console.log(`  ${p.policyname} (${p.cmd}): ${p.qual}`);
  });

  // Check if profiles has RLS enabled
  const { rows: rlsCheck } = await client.query(
    "SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'profiles'"
  );
  console.log("\nProfiles RLS enabled:", JSON.stringify(rlsCheck));

  // Test: can authenticated role read their own profile?
  const { rows: adminProfile } = await client.query(
    "SELECT id, email, role FROM profiles WHERE role = 'admin' LIMIT 1"
  );
  if (adminProfile[0]) {
    const adminId = adminProfile[0].id;
    try {
      await client.query(`SET LOCAL role TO 'authenticated'`);
      await client.query(`SET LOCAL request.jwt.claims TO '${JSON.stringify({ sub: adminId, role: "authenticated" })}'`);
      
      // Test auth.uid()
      const { rows: uidTest } = await client.query("SELECT auth.uid() as uid");
      console.log(`\nauth.uid() = ${uidTest[0].uid}`);
      
      // Test reading own profile
      const { rows: ownProfile } = await client.query("SELECT id, role FROM profiles WHERE id = $1", [adminId]);
      console.log(`Own profile visible: ${ownProfile.length > 0}`);
      
      // Test has_role directly
      const { rows: hr } = await client.query("SELECT public.has_role(array['admin','manager']) as result");
      console.log(`has_role(['admin','manager']) = ${hr[0].result}`);
      
      // Test the inner query directly
      const { rows: inner } = await client.query(
        "SELECT exists(select 1 from public.profiles p where p.id = auth.uid() and p.role::text = any(array['admin','manager'])) as result"
      );
      console.log(`Inner query result = ${inner[0].result}`);
      
      await client.query(`RESET ROLE`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
      await client.query(`RESET ROLE`);
    }
  }

  await client.end();
}

diag().catch(console.error);
