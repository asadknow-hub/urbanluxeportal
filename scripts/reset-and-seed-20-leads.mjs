import fs from "fs";
import pg from "pg";

const envContent = fs.readFileSync(".env.local", "utf-8");
const projectRef = envContent
  .match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]
  ?.trim()
  .replace("https://", "")
  .split(".")[0];
const dbPassword = envContent.match(/SUPABASE_DB_PASSWORD=(.+)/)?.[1]?.trim();
if (!projectRef || !dbPassword) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD in .env.local");
  process.exit(1);
}

const encodedPass = encodeURIComponent(dbPassword);
const urls = [
  `postgresql://postgres.${projectRef}:${encodedPass}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodedPass}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodedPass}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres:${encodedPass}@db.${projectRef}.supabase.co:5432/postgres`,
];

const NAMES = [
  "Helen Cruz",
  "David Wilson",
  "Fatima Al Suwaidi",
  "James Cooper",
  "Priya Sharma",
  "Omar Al Zaabi",
  "Sophie Martin",
  "Hassan Ali",
  "Maya Patel",
  "Tom Brown",
  "Aisha Al Hashimi",
  "Karan Mehta",
  "Nora Ahmed",
  "Victor Orlov",
  "Layla Hassan",
  "John Smith",
  "Reem Abdullah",
  "Raj Patel",
  "Anna Schmidt",
  "Yusuf Khan",
];

const SOURCES = ["website", "bayut", "property_finder", "dubizzle", "referral", "walk_in", "social", "other"];
const INTERESTS = ["buy", "rent", "sell", "off_plan", "commercial"];
const LANGUAGES = ["en", "ar", "ru", "hi", "zh"];
const FINANCING = ["cash", "mortgage", "undecided", null];
const TIMEFRAMES = ["immediate", "3_months", "6_months", "12_months", null];
const PURPOSES = ["end_user", "investment", "both", null];
const BEDROOMS = ["studio", "1", "2", "3", "4+"];
const CATEGORIES = ["apartment", "villa", "townhouse", "commercial", "off_plan"];
const AREAS = [
  "Downtown Dubai",
  "Dubai Marina",
  "Palm Jumeirah",
  "Business Bay",
  "Jumeirah Village Circle",
  "Dubai Hills Estate",
];

async function connect() {
  for (const connectionString of urls) {
    const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      return client;
    } catch {
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  throw new Error("Could not connect to Postgres. Check pooler region / DB password.");
}

const client = await connect();
console.log("Connected");

const { rows: stages } = await client.query(
  "select id, name, kind from public.lead_stages where is_active = true order by sort"
);
const openStages = stages.filter((s) => s.kind === "open");
if (openStages.length === 0) {
  console.error("No open lead stages found");
  process.exit(1);
}

const { rows: people } = await client.query(
  "select id, full_name, role from public.profiles where is_active = true and role in ('admin','manager','agent') order by full_name"
);
const adminId = people.find((p) => p.role === "admin")?.id ?? people[0]?.id;
if (!adminId) {
  console.error("No profiles found");
  process.exit(1);
}

await client.query("begin");
try {
  const { rows: before } = await client.query("select count(*)::int as n from public.leads");
  console.log(`Deleting ${before[0].n} existing leads...`);
  await client.query("delete from public.leads");

  for (let i = 0; i < 20; i++) {
    const name = NAMES[i];
    const source = SOURCES[i % SOURCES.length];
    const interest = INTERESTS[i % INTERESTS.length];
    const stage = openStages[i % openStages.length];
    const assigned = i % 4 === 0 ? null : people[i % people.length].id;
    const budgetMin = [500_000, 1_200_000, 2_500_000, 4_800_000, 8_000_000][i % 5] * 100;
    const budgetMax = budgetMin + [300_000, 800_000, 1_500_000][i % 3] * 100;
    const preferred = [AREAS[i % AREAS.length], AREAS[(i + 2) % AREAS.length]];
    const phone = `+97150${String(1000000 + i).slice(-7)}`;
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".")}.${i + 1}@example.com`;
    const createdAt = new Date(Date.now() - (20 - i) * 86400000).toISOString();
    const followUp = i % 3 === 0 ? new Date(Date.now() + (i + 1) * 86400000).toISOString() : null;
    const score = 20 + ((i * 7) % 75);

    await client.query(
      `insert into public.leads (
        name, phone, email, source, interest,
        budget_min, budget_max, preferred_areas, notes, status, score, score_reason,
        assigned_to, next_follow_up_at, created_by, created_at, updated_at,
        stage_id, language, financing, timeframe, purpose, bedrooms, category,
        tags, last_activity_at, last_inquiry_at, custom
      ) values (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,'new',$10,$11,
        $12,$13,$14,$15,$15,
        $16,$17,$18,$19,$20,$21,$22,
        $23,$15,$15,'{}'::jsonb
      )`,
      [
        name,
        phone,
        email,
        source,
        interest,
        budgetMin,
        budgetMax,
        preferred,
        `Seed lead for ${interest} in ${preferred[0]}.`,
        score,
        "Seeded score for demo ranking",
        assigned,
        followUp,
        adminId,
        createdAt,
        stage.id,
        LANGUAGES[i % LANGUAGES.length],
        FINANCING[i % FINANCING.length],
        TIMEFRAMES[i % TIMEFRAMES.length],
        PURPOSES[i % PURPOSES.length],
        BEDROOMS[i % BEDROOMS.length],
        CATEGORIES[i % CATEGORIES.length],
        i % 2 === 0 ? ["vip"] : ["warm"],
      ]
    );
  }

  await client.query("commit");
} catch (err) {
  await client.query("rollback");
  throw err;
}

const { rows: after } = await client.query(
  "select count(*)::int as n from public.leads where deleted_at is null"
);
console.log(`Seeded ${after[0].n} leads`);
await client.end();
