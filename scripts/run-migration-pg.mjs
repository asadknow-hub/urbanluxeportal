// Run migration via Supabase Management API
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf-8");
const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const projectRef = url.replace("https://", "").split(".")[0];
console.log("Project ref:", projectRef);

// The management API needs a personal access token, not the service role key
// Let's try the pg endpoint directly using the service role key as a Bearer token
// to the database endpoint

// Actually, let's use the supabase SQL endpoint that accepts the service role key
// POST https://<project>.supabase.co/pg/query
const sql = fs.readFileSync("supabase/migrations/0010_leads_module.sql", "utf-8");

// Try the /pg/query endpoint (available in newer Supabase)
const response = await fetch(`${url}/pg/query`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${serviceKey}`,
    "apikey": serviceKey,
  },
  body: JSON.stringify({ query: sql }),
});

console.log("Response status:", response.status);
const text = await response.text();
console.log("Response:", text.substring(0, 1000));
