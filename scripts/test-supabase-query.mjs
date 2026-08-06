// Simulate what the leads page does - test the exact Supabase query
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf-8");
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
const serviceMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const url = urlMatch ? urlMatch[1].trim() : null;
const anonKey = keyMatch ? keyMatch[1].trim() : null;
const serviceKey = serviceMatch ? serviceMatch[1].trim() : null;

console.log("URL:", url);
console.log("Anon key present:", !!anonKey);
console.log("Service key present:", !!serviceKey);

// Test 1: anon key (what the server component uses)
console.log("\n--- Test 1: Anon key (no auth) ---");
const anonClient = createClient(url, anonKey);
const { data: anonData, error: anonError, count: anonCount } = await anonClient
  .from("leads")
  .select("*, assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url)", { count: "exact" })
  .is("deleted_at", null)
  .order("created_at", { ascending: false })
  .limit(50);

console.log("Anon query result:", { count: anonCount, leads: anonData?.length, error: anonError?.message });

// Test 2: service role key (bypasses RLS)
console.log("\n--- Test 2: Service role key ---");
const serviceClient = createClient(url, serviceKey);
const { data: svcData, error: svcError, count: svcCount } = await serviceClient
  .from("leads")
  .select("*, assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url)", { count: "exact" })
  .is("deleted_at", null)
  .order("created_at", { ascending: false })
  .limit(50);

console.log("Service query result:", { count: svcCount, leads: svcData?.length, error: svcError?.message });

// Test 3: Test insert with anon key (no auth)
console.log("\n--- Test 3: Insert with anon key (no auth) ---");
const { data: insData, error: insError } = await anonClient
  .from("leads")
  .insert({
    name: "Test Anon Insert",
    source: "website",
    interest: "buy",
  })
  .select("id")
  .single();

console.log("Insert result:", { data: insData, error: insError?.message });

// Test 4: Test insert with service role
console.log("\n--- Test 4: Insert with service role ---");
const { data: svcInsData, error: svcInsError } = await serviceClient
  .from("leads")
  .insert({
    name: "Test Service Insert",
    source: "website",
    interest: "buy",
  })
  .select("id")
  .single();

console.log("Service insert result:", { data: svcInsData, error: svcInsError?.message });

// Test 5: Check if the join query causes issues
console.log("\n--- Test 5: Simple select without join (anon) ---");
const { data: simpleData, error: simpleError, count: simpleCount } = await anonClient
  .from("leads")
  .select("*", { count: "exact" })
  .is("deleted_at", null)
  .order("created_at", { ascending: false })
  .limit(50);

console.log("Simple select result:", { count: simpleCount, leads: simpleData?.length, error: simpleError?.message });

// Test 6: Check if profiles RLS blocks the join
console.log("\n--- Test 6: Profiles select (anon, no auth) ---");
const { data: profData, error: profError } = await anonClient
  .from("profiles")
  .select("id, full_name, role")
  .in("role", ["admin", "manager", "agent"])
  .eq("is_active", true)
  .order("full_name");

console.log("Profiles query result:", { count: profData?.length, error: profError?.message });
