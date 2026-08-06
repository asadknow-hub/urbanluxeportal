import { Client } from "pg";

const connectionString =
  "postgresql://postgres.dpzcnokaihewwirlvysq:Groot%4022122212@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function diag() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Check foreign key constraint names on leads table
  const { rows: fks } = await client.query(`
    SELECT conname, conrelid::regclass as table, confrelid::regclass as ref_table, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'public.leads'::regclass AND contype = 'f'
  `);
  console.log("Foreign keys on leads table:");
  fks.forEach((f) => console.log(`  ${f.conname}: ${f.def}`));

  // Check if the Supabase client query would work
  // The page uses: profiles!leads_assigned_to_fkey(id, full_name, avatar_url)
  // Let's check if that FK name exists
  const fkName = fks.find((f) => f.conname === "leads_assigned_to_fkey");
  console.log("\n'leads_assigned_to_fkey' exists:", !!fkName);

  if (!fkName) {
    console.log("Actual FK names:", fks.map((f) => f.conname));
  }

  // Also check what the Supabase anon key client would see
  // Let's simulate the exact query the page does
  console.log("\n--- Simulating page query ---");
  const adminId = "7cdcac40-6c6f-474f-8cec-fe0a2afaedbc";
  await client.query(`SET LOCAL role TO 'authenticated'`);
  await client.query(`SET LOCAL request.jwt.claims TO '${JSON.stringify({ sub: adminId, role: "authenticated" })}'`);

  // Simple select first
  const { rows: simple } = await client.query(`SELECT count(*) as cnt FROM public.leads WHERE deleted_at IS NULL`);
  console.log("Simple count:", simple[0].cnt);

  // Now with the join (simulating what Supabase does)
  const { rows: joined, error } = await client.query(`
    SELECT l.*, p.id as pid, p.full_name, p.avatar_url
    FROM public.leads l
    LEFT JOIN public.profiles p ON l.assigned_to = p.id
    WHERE l.deleted_at IS NULL
    ORDER BY l.created_at DESC
    LIMIT 5
  `);
  console.log("Joined query rows:", joined.length);
  if (joined.length > 0) {
    console.log("First row:", joined[0].name, joined[0].status);
  }

  await client.query(`RESET ROLE`);

  // Check the actual Supabase API - test with fetch
  console.log("\n--- Testing Supabase REST API ---");
  const url = "https://dpzcnokaihewwirlvysq.supabase.co/rest/v1/leads?select=id,name,status&deleted_at=is.null&limit=5";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZmVyZW5jZSI6ImRwemNub2thaWhld3dpcmxyYXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTYzNzEsImV4cCI6MjA2ODUzMjM3MX0.DcDdL4-_05z6hNOh2vXh3x4mQcR1v4mR4v4mR4v4mR4";

  // Read .env.local for the anon key
  const fs = await import("fs");
  const envContent = fs.readFileSync(".env.local", "utf-8");
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
  const actualKey = keyMatch ? keyMatch[1].trim() : null;
  console.log("Anon key found:", !!actualKey);

  if (actualKey) {
    const res = await fetch(url.replace("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZmVyZW5jZSI6ImRwemNub2thaWhld3dpcmxyYXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTYzNzEsImV4cCI6MjA2ODUzMjM3MX0.DcDdL4-_05z6hNOh2vXh3x4mQcR1v4mR4v4mR4v4mR4", actualKey), {
      headers: {
        apikey: actualKey,
        Authorization: `Bearer ${actualKey}`,
      },
    });
    console.log("API response status:", res.status);
    const data = await res.json();
    console.log("API response data:", JSON.stringify(data).substring(0, 300));
  }

  await client.end();
}

diag().catch(console.error);
