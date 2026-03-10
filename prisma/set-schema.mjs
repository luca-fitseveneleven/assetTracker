#!/usr/bin/env node
/**
 * Build-time script that substitutes the PostgreSQL schema name in:
 *   - prisma/schema.prisma  (@@schema / schemas directives)
 *   - prisma/migrations/     (CREATE SCHEMA, SET search_path, table_schema refs)
 *
 * Usage:
 *   DB_SCHEMA=public node prisma/set-schema.mjs
 *
 * When DB_SCHEMA matches the value already in the files (default "assettool"),
 * nothing changes and migration checksums stay intact.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env if DB_SCHEMA isn't already set
if (!process.env.DB_SCHEMA) {
  const envPath = resolve(__dirname, "..", ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const TARGET = process.env.DB_SCHEMA || "assettool";
const SOURCE = "assettool"; // the schema name currently hardcoded in all files

if (TARGET === SOURCE) {
  console.log(`[set-schema] DB_SCHEMA="${TARGET}" (unchanged, skipping)`);
  process.exit(0);
}

console.log(`[set-schema] Replacing schema "${SOURCE}" → "${TARGET}"`);

// --- 1. Patch prisma/schema.prisma ---
const schemaPath = join(__dirname, "schema.prisma");
let schema = readFileSync(schemaPath, "utf-8");

// schemas = ["assettool"]  →  schemas = ["public"]
schema = schema.replace(
  new RegExp(`schemas\\s*=\\s*\\["${SOURCE}"\\]`, "g"),
  `schemas  = ["${TARGET}"]`,
);

// @@schema("assettool")  →  @@schema("public")
schema = schema.replace(
  new RegExp(`@@schema\\("${SOURCE}"\\)`, "g"),
  `@@schema("${TARGET}")`,
);

writeFileSync(schemaPath, schema);
console.log(`  ✓ schema.prisma`);

// --- 2. Patch migration SQL files ---
const migrationsDir = join(__dirname, "migrations");
if (existsSync(migrationsDir)) {
  const migrations = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const migration of migrations) {
    const sqlPath = join(migrationsDir, migration, "migration.sql");
    if (!existsSync(sqlPath)) continue;

    const original = readFileSync(sqlPath, "utf-8");
    let sql = original;

    // CREATE SCHEMA IF NOT EXISTS "assettool"  →  "public"
    sql = sql.replace(
      new RegExp(`CREATE SCHEMA IF NOT EXISTS "${SOURCE}"`, "g"),
      `CREATE SCHEMA IF NOT EXISTS "${TARGET}"`,
    );

    // SET search_path TO "assettool"  →  "public"
    sql = sql.replace(
      new RegExp(`SET search_path TO "${SOURCE}"`, "g"),
      `SET search_path TO "${TARGET}"`,
    );

    // table_schema = 'assettool'  →  'public'
    sql = sql.replace(
      new RegExp(`table_schema = '${SOURCE}'`, "g"),
      `table_schema = '${TARGET}'`,
    );

    if (sql !== original) {
      writeFileSync(sqlPath, sql);
      console.log(`  ✓ migrations/${migration}`);
    }
  }
}

console.log(`[set-schema] Done.`);
