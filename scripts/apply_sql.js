const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const sqlPath = process.argv[2] || process.env.SUPABASE_DB_URL && process.env.SQL_FILE || 'supabase/sql/manual_apply_roles_rls.sql';
  const dbUrl = process.argv[3] || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('Usage: node apply_sql.js <sql-file> <db-url>   OR set SUPABASE_DB_URL env var');
    process.exit(2);
  }
  const file = process.argv[2] || 'supabase/sql/manual_apply_roles_rls.sql';
  console.log('Reading SQL file:', file);
  const sql = fs.readFileSync(file, 'utf8');
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to DB, executing SQL...');
    await client.query(sql);
    console.log('SQL executed successfully.');

    const checks = [
      { name: 'is_ceo_exists', sql: "select count(*) as c from pg_proc where proname='is_ceo'" },
      { name: 'is_manager_exists', sql: "select count(*) as c from pg_proc where proname='is_manager'" },
      { name: 'has_feature_exists', sql: "select count(*) as c from pg_proc where proname='has_feature'" },
      { name: 'inventory_policies', sql: "select policyname from pg_policies where schemaname='public' and tablename='inventory_products'" },
      { name: 'invites_policies', sql: "select policyname from pg_policies where schemaname='public' and tablename='invites'" },
    ];
    for (const c of checks) {
      const res = await client.query(c.sql);
      console.log('CHECK', c.name, JSON.stringify(res.rows));
    }

  } catch (err) {
    console.error('SQL execution error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
