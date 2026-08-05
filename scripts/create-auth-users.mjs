import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://dpzcnokaihewwirlvysq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwemNub2thaWhld3dpcmx2eXNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkxOTIwNiwiZXhwIjoyMTAxNDk1MjA2fQ.odg4kQ5Q9ILIJuGh8fpCnY-m6cY99BSgezCvIYjwYok",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const users = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    email: "admin@urbanluxe.ae",
    password: "UrbanLuxe@2026",
    full_name: "Ahmed Al Mansoori",
    role: "admin",
  },
  {
    id: "a0000000-0000-0000-0000-000000000002",
    email: "sara@urbanluxe.ae",
    password: "UrbanLuxe@2026",
    full_name: "Sara Al Hashimi",
    role: "agent",
  },
  {
    id: "a0000000-0000-0000-0000-000000000003",
    email: "john@urbanluxe.ae",
    password: "UrbanLuxe@2026",
    full_name: "John Matthews",
    role: "agent",
  },
  {
    id: "a0000000-0000-0000-0000-000000000004",
    email: "fatima@urbanluxe.ae",
    password: "UrbanLuxe@2026",
    full_name: "Fatima Al Zaabi",
    role: "agent",
  },
  {
    id: "a0000000-0000-0000-0000-000000000005",
    email: "raj@urbanluxe.ae",
    password: "UrbanLuxe@2026",
    full_name: "Raj Patel",
    role: "accountant",
  },
];

async function run() {
  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      user_id: u.id,
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });

    if (error) {
      console.log(`✗ ${u.email} — ${error.message}`);
    } else {
      console.log(`✓ ${u.email} — created (id: ${data.user.id})`);
    }
  }
}

run().catch(console.error);
