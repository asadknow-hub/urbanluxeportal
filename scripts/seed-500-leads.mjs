// Seed 500 leads across stages for board performance testing
import fs from "fs";
import pg from "pg";

const envContent = fs.readFileSync(".env.local", "utf-8");
const projectRef = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim().replace("https://", "").split(".")[0];
const dbPassword = envContent.match(/SUPABASE_DB_PASSWORD=(.+)/)?.[1]?.trim();
const encodedPass = encodeURIComponent(dbPassword);
const connectionString = `postgresql://postgres:${encodedPass}@db.${projectRef}.supabase.co:5432/postgres`;

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

console.log("Connected, seeding 500 leads...");

// Get stage IDs
const { rows: stages } = await client.query("SELECT id, name FROM public.lead_stages WHERE kind = 'open' ORDER BY sort");
console.log("Stages:", stages.map(s => s.name).join(", "));

// Get a user for created_by
const { rows: users } = await client.query("SELECT id FROM public.profiles LIMIT 1");
const userId = users[0]?.id;
if (!userId) { console.error("No users found"); process.exit(1); }

const names = [
  "Ahmed Al Mansoori", "Fatima Al Sayed", "John Smith", "Sarah Johnson", "Mohammed Khan",
  "Priya Sharma", "Raj Patel", "Emily Davis", "Omar Al Futtaim", "Layla Hassan",
  "David Chen", "Maria Garcia", "Yusuf Al Nahyan", "Aisha Al Maktoum", "James Wilson",
  "Zhang Wei", "Olga Ivanova", "Hassan Ali", "Sophie Martin", "Khalid Al Rashid",
  "Nora Abdullah", "Michael Brown", "Wei Zhang", "Anastasia Petrova", "Ali Al Hosani",
];

const sources = ["website", "bayut", "property_finder", "dubizzle", "referral", "walk_in", "social", "other"];
const interests = ["buy", "rent", "sell", "off_plan", "commercial"];
const areas = ["Dubai Marina", "JVC", "Downtown Dubai", "Palm Jumeirah", "Business Bay", "Arabian Ranches", "JBR", "Dubai Hills"];

let inserted = 0;
for (let i = 0; i < 500; i++) {
  const name = names[i % names.length] + " " + (Math.floor(i / names.length) + 1);
  const phone = `+9715${String(Math.floor(1000000 + Math.random() * 8999999))}`;
  const email = `lead${i}@example.com`;
  const source = sources[i % sources.length];
  const interest = interests[i % interests.length];
  const stage = stages[i % stages.length];
  const budgetMin = Math.floor(Math.random() * 5 + 1) * 100000 * 100; // fils
  const budgetMax = budgetMin + Math.floor(Math.random() * 5 + 1) * 100000 * 100;
  const area = [areas[i % areas.length]];
  const assigned = i % 3 === 0 ? null : userId;
  const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
  const updatedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();

  await client.query(
    `INSERT INTO public.leads (name, phone, email, source, interest, budget_min, budget_max, preferred_areas, notes, status, stage_id, assigned_to, created_by, created_at, updated_at, last_activity_at, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15, '{}'::text[])`,
    [name, phone, email, source, interest, budgetMin, budgetMax, area, "Seeded lead", "new", stage.id, assigned, userId, createdAt, updatedAt]
  );
  inserted++;
}

console.log(`Seeded ${inserted} leads successfully!`);

// Verify count
const { rows } = await client.query("SELECT count(*) FROM public.leads WHERE deleted_at IS NULL");
console.log("Total leads in DB:", rows[0].count);

await client.end();
