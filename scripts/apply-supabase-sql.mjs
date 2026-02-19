#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const dbUrlRaw = process.env.SUPABASE_DB_URL;
if (!dbUrlRaw) {
  console.error('Missing SUPABASE_DB_URL in .env.local — add it under Settings → Database → Connection string.');
  process.exit(2);
}

// sanitize common copy/paste mistakes: strip surrounding brackets and whitespace/newlines
const dbUrl = dbUrlRaw.replace(/[\n\r]+/g, '').replace(/^\s+|\s+$/g, '').replace(/^\(+|\)+$/g, '').replace(/\[|\]/g, '');

const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
// prefer db push (will need project link or --db-url). Use --db-url to avoid linking.
console.log('Using SUPABASE_DB_URL from .env.local');
console.log('Attempting: npx supabase db push --db-url <SUPABASE_DB_URL>');

const push = spawn('npx', ['supabase', 'db', 'push', '--db-url', dbUrl], { stdio: 'inherit', shell: true });
push.on('exit', (code) => {
  if (code === 0) {
    console.log('supabase db push succeeded');
    process.exit(0);
  }
  console.error('supabase db push failed with code', code);
  // fallback: attempt to find a manual SQL file and run it via node script apply_sql.js
  const manual = path.resolve(process.cwd(), 'supabase', 'sql', 'manual_apply_roles_rls.sql');
  const applyScript = path.resolve(process.cwd(), 'scripts', 'apply_sql.js');
  if (fs.existsSync(applyScript) && fs.existsSync(manual)) {
    console.log('Falling back to node SQL executor');
    const run = spawn('node', [applyScript, manual, dbUrl], { stdio: 'inherit', shell: true });
    run.on('exit', (c) => process.exit(c ?? 1));
  } else if (fs.existsSync(manual)) {
    console.error('No SQL executor found (scripts/apply_sql.js missing). Cannot apply manual SQL.');
    process.exit(1);
  } else {
    console.error('No manual SQL found to apply.');
    process.exit(1);
  }
});
