#!/usr/bin/env node
/**
 * Apply SQL against the live Supabase Postgres using DATABASE_URL.
 * Never prints the connection string.
 *
 *   node scripts/db.mjs --file supabase/migrations/0026_ensure_deal_buyer_schema.sql
 *   node scripts/db.mjs --query "select 1"
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = value;
  }
}

function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let dollarTag = null;

  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (!inSingle && !inDouble && !dollarTag && ch === "-" && next === "-") {
      while (i < sql.length && sql[i] !== "\n") i += 1;
      current += "\n";
      continue;
    }

    if (!inSingle && !inDouble && !dollarTag && ch === "/" && next === "*") {
      i += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }

    if (!inDouble && !dollarTag && ch === "'" && !inSingle) {
      inSingle = true;
      current += ch;
      i += 1;
      continue;
    }
    if (inSingle) {
      current += ch;
      if (ch === "'" && next === "'") {
        current += next;
        i += 2;
        continue;
      }
      if (ch === "'") inSingle = false;
      i += 1;
      continue;
    }

    if (!inSingle && !dollarTag && ch === '"') {
      inDouble = !inDouble;
      current += ch;
      i += 1;
      continue;
    }

    if (!inSingle && !inDouble && ch === "$") {
      const match = sql.slice(i).match(/^\$[a-zA-Z0-9_]*\$/);
      if (match) {
        const tag = match[0];
        if (dollarTag === null) dollarTag = tag;
        else if (dollarTag === tag) dollarTag = null;
        current += tag;
        i += tag.length;
        continue;
      }
    }

    if (!inSingle && !inDouble && !dollarTag && ch === ";") {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = "";
      i += 1;
      continue;
    }

    current += ch;
    i += 1;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

loadEnvLocal();

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    "Missing DATABASE_URL in .env.local.\nCopy the URI from Supabase → Project Settings → Database → Connection string.\nUse Direct connection or Session pooler (port 5432), not Transaction pooler."
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const fileFlag = args.indexOf("--file");
const queryFlag = args.indexOf("--query");

let sql = "";
let label = "query";
if (fileFlag >= 0) {
  const filePath = args[fileFlag + 1];
  if (!filePath) {
    console.error("Missing path after --file");
    process.exit(1);
  }
  sql = fs.readFileSync(filePath, "utf8");
  label = filePath;
} else if (queryFlag >= 0) {
  sql = args.slice(queryFlag + 1).join(" ");
} else {
  console.error("Usage: node scripts/db.mjs --file path.sql | --query \"SQL\"");
  process.exit(1);
}

const statements = splitSqlStatements(sql);
if (statements.length === 0) {
  console.error("No SQL to run");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  for (const statement of statements) {
    const result = await client.query(statement);
    if (Array.isArray(result.rows) && result.rows.length > 0 && queryFlag >= 0) {
      console.log(JSON.stringify(result.rows, null, 2));
    }
  }
  console.log(`OK (${statements.length} statement${statements.length === 1 ? "" : "s"}) ${label}`);
} finally {
  await client.end();
}
