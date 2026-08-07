// Run migration 0010 via Supabase REST API (using service role key + rpc)
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envContent = fs.readFileSync(".env.local", "utf-8");
const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

console.log("URL:", url);
console.log("Service key present:", !!serviceKey);

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Execute the migration SQL via the pg exec function
const sql = fs.readFileSync("supabase/migrations/0010_leads_module.sql", "utf-8");

// Split into statements and execute via rpc
// Supabase doesn't have a raw SQL exec via REST, but we can use the pg_meta endpoint
// Actually, let's try using the management API or just execute via a custom RPC

// Try using the supabase SQL endpoint
const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
  },
  body: JSON.stringify({ sql_text: sql }),
});

console.log("Response status:", response.status);
const text = await response.text();
console.log("Response:", text.substring(0, 500));
