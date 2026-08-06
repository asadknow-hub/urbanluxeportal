import { Client } from "pg";

const connectionString =
  "postgresql://postgres.dpzcnokaihewwirlvysq:Groot%4022122212@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

// Fetch existing agent profiles to assign leads to
async function getAgents(client) {
  const res = await client.query(
    "SELECT id, full_name, role FROM public.profiles WHERE role IN ('admin', 'manager', 'agent') AND is_active = true ORDER BY full_name"
  );
  return res.rows;
}

async function seed() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  console.log("Connecting...");
  await client.connect();
  console.log("Connected!\n");

  const agents = await getAgents(client);
  if (agents.length === 0) {
    console.error("No agents found. Create staff first.");
    await client.end();
    return;
  }
  console.log(`Found ${agents.length} agents:`, agents.map((a) => a.full_name).join(", "));

  const agentIds = agents.map((a) => a.id);
  const adminId = agents.find((a) => a.role === "admin")?.id ?? agents[0].id;

  // Dubai areas for preferred_areas
  const areas = ["Downtown Dubai", "Dubai Marina", "JBR", "Business Bay", "Palm Jumeirah", "JVC", "Arabian Ranches", "Damac Hills", "Dubai Hills", "Mudon"];
  const sources = ["website", "bayut", "property_finder", "dubizzle", "referral", "walk_in", "social"];
  const interests = ["buy", "rent", "sell", "off_plan", "commercial"];
  const statuses = ["new", "contacted", "qualified", "unqualified", "converted"];

  // Lead names
  const leadNames = [
    "Ahmed Al Mansoori", "Sarah Johnson", "Raj Patel", "Fatima Al Suwaidi", "John Smith",
    "Aisha Al Hashimi", "Mohammed Al Falasi", "Priya Sharma", "David Chen", "Layla Al Rashid",
    "Omar Al Zaabi", "Emma Wilson", "Khalid Al Maktoum", "Nisha Agarwal", "James Brown",
    "Hind Al Nuaimi", "Vikram Singh", "Sophie Martin", "Abdullah Al Shehhi", "Lisa Wang",
    "Yousef Al Marri", "Tom Anderson", "Mariam Al Shamsi", "Ravi Kumar", "Olivia Taylor",
  ];

  // Insert leads
  console.log("\nInserting leads...");
  const leadIds = [];
  for (let i = 0; i < leadNames.length; i++) {
    const name = leadNames[i];
    const source = sources[i % sources.length];
    const interest = interests[i % interests.length];
    const status = i < 5 ? "new" : i < 10 ? "contacted" : i < 15 ? "qualified" : i < 18 ? "unqualified" : "converted";
    const assignedTo = i < 3 ? null : agentIds[i % agentIds.length];
    const budgetMin = [500000, 1000000, 2000000, 5000000, 8000000][i % 5] * 100;
    const budgetMax = budgetMin + [500000, 1000000, 2000000][i % 3] * 100;
    const score = status === "qualified" ? 70 + (i % 30) : status === "contacted" ? 40 + (i % 30) : status === "new" ? 10 + (i % 30) : null;
    const preferredAreas = [areas[i % areas.length], areas[(i + 3) % areas.length]];
    const phone = `+9715${String(0 + i).padStart(8, "0").slice(-8)}`;
    const email = name.toLowerCase().replace(/[^a-z]/g, ".") + "@example.com";
    const followUp = status === "contacted" || status === "qualified" ? new Date(Date.now() + (i + 1) * 86400000).toISOString() : null;
    const createdAt = new Date(Date.now() - i * 86400000).toISOString();

    const res = await client.query(
      `INSERT INTO public.leads (name, phone, email, source, interest, budget_min, budget_max, preferred_areas, notes, status, score, score_reason, assigned_to, next_follow_up_at, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        name, phone, email, source, interest, budgetMin, budgetMax, preferredAreas,
        `Interested in ${interest} properties in ${preferredAreas[0]}. Budget range AED ${budgetMin/100} - ${budgetMax/100}.`,
        status, score, score ? `Score based on engagement and budget` : null,
        assignedTo, followUp, adminId, createdAt,
      ]
    );
    if (res.rows[0]) {
      leadIds.push(res.rows[0].id);
      // Add a lead activity
      await client.query(
        `INSERT INTO public.lead_activities (lead_id, type, summary, occurred_at)
         VALUES ($1, $2, $3, $4)`,
        [res.rows[0].id, "note", `Lead created from ${source}`, createdAt]
      );
    }
  }
  console.log(`  ✓ Inserted ${leadIds.length} leads`);

  // For converted leads (indices 18-24), create deals + customers
  console.log("\nCreating deals + customers for converted leads...");
  let dealCount = 0;
  let custCount = 0;
  for (let i = 18; i < leadNames.length; i++) {
    const leadIdx = i - 18;
    const leadId = leadIds[i];
    if (!leadId) continue;

    const name = leadNames[i];
    const interest = interests[i % interests.length];
    const dealType = interest === "rent" ? "rental" : interest === "off_plan" ? "off_plan" : "sale";
    const stages = ["inquiry", "viewing", "negotiation", "offer", "contract", "won", "lost"];
    const stage = stages[leadIdx % stages.length];
    const value = [1000000, 2500000, 5000000, 8000000, 12000000][leadIdx % 5] * 100;
    const assignedTo = agentIds[i % agentIds.length];
    const createdAt = new Date(Date.now() - i * 86400000).toISOString();
    const stageChangedAt = new Date(Date.now() - (i - 2) * 86400000).toISOString();

    // Create customer (prospect or active based on deal stage)
    const custStatus = stage === "won" ? "active" : "prospect";
    const custRes = await client.query(
      `INSERT INTO public.customers (type, name, phone, email, notes, assigned_to, created_by, lead_id, status, created_at)
       VALUES ('individual', $1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [name, `+9715${String(0 + i).padStart(8, "0").slice(-8)}`, name.toLowerCase().replace(/[^a-z]/g, ".") + "@example.com",
       `Converted from lead. Interested in ${interest}.`, assignedTo, adminId, leadId, custStatus, createdAt]
    );
    const customerId = custRes.rows[0].id;
    custCount++;

    // Create deal
    const dealRes = await client.query(
      `INSERT INTO public.deals (title, customer_id, deal_type, stage, value, assigned_to, created_by, lead_id, stage_changed_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [`${interest} — ${name}`, customerId, dealType, stage, value, assignedTo, adminId, leadId, stageChangedAt, createdAt]
    );
    const dealId = dealRes.rows[0].id;
    dealCount++;

    // Update lead with converted IDs
    await client.query(
      `UPDATE public.leads SET converted_customer_id = $1, converted_deal_id = $2 WHERE id = $3`,
      [customerId, dealId, leadId]
    );

    // Add deal activities
    await client.query(
      `INSERT INTO public.deal_activities (deal_id, type, summary, occurred_at) VALUES ($1, 'created', $2, $3)`,
      [dealId, `Deal created from lead: ${name}`, createdAt]
    );
    if (stage !== "inquiry") {
      await client.query(
        `INSERT INTO public.deal_activities (deal_id, type, summary, occurred_at) VALUES ($1, 'stage_change', $2, $3)`,
        [dealId, `Stage changed: inquiry → ${stage}`, stageChangedAt]
      );
    }
    if (stage === "won") {
      await client.query(
        `INSERT INTO public.deal_activities (deal_id, type, summary, occurred_at) VALUES ($1, 'won', $2, $3)`,
        [dealId, `Deal won — Value: ${value/100} AED`, stageChangedAt]
      );
    }
  }
  console.log(`  ✓ Created ${custCount} customers and ${dealCount} deals`);

  // Also create a few standalone deals (direct customers, no lead)
  console.log("\nCreating standalone deals...");
  let standaloneCount = 0;
  for (let i = 0; i < 3; i++) {
    const name = ["Direct Client LLC", "Walk-in Investor", "Repeat Customer"][i];
    const dealType = ["sale", "rental", "off_plan"][i];
    const stage = ["negotiation", "viewing", "offer"][i];
    const value = [3000000, 1500000, 6000000][i] * 100;
    const assignedTo = agentIds[i % agentIds.length];
    const createdAt = new Date(Date.now() - (20 + i) * 86400000).toISOString();

    const custRes = await client.query(
      `INSERT INTO public.customers (type, name, assigned_to, created_by, status, created_at)
       VALUES ($1, $2, $3, $4, 'prospect', $5) RETURNING id`,
      [i === 0 ? "company" : "individual", name, assignedTo, adminId, createdAt]
    );
    const customerId = custRes.rows[0].id;

    const dealRes = await client.query(
      `INSERT INTO public.deals (title, customer_id, deal_type, stage, value, assigned_to, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [`${dealType} — ${name}`, customerId, dealType, stage, value, assignedTo, adminId, createdAt]
    );
    standaloneCount++;
  }
  console.log(`  ✓ Created ${standaloneCount} standalone deals`);

  await client.end();
  console.log("\n✅ Seed complete!");
}

seed().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
