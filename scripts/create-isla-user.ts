/**
 * scripts/create-isla-user.ts
 *
 * Creates the special "Isla" Supabase auth account and inserts her
 * user_profiles row so that her posts/comments are auto-approved.
 *
 * Usage (from repo root):
 *   npx ts-node scripts/create-isla-user.ts
 *
 * Requires: .env.local with SUPABASE_SERVICE_ROLE_KEY (always needed).
 * The Supabase project URL is read from NEXT_PUBLIC_SUPABASE_URL; if that's
 * a placeholder the script falls back to the Supabase CLI project-ref file.
 *
 * The account is created without a password. Set one via:
 *   Supabase Dashboard → Authentication → Users → isla@rushtheweb.com → Edit
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local so the script works without pre-exporting vars
const envFile = resolve(__dirname, '../.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

const ISLA_EMAIL = 'isla@rushtheweb.com';
// Stable family UUID used across the codebase (src/lib/wallGuest.ts)
const ISLA_FAMILY_ID = '5c03b0c0-3c65-4e9a-981a-3edd3dcb015c';

function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (raw && !raw.includes('demo.supabase.co') && !raw.includes('placeholder')) {
    return raw;
  }
  // Fall back to Supabase CLI project ref
  try {
    const refFile = resolve(__dirname, '../supabase/.temp/project-ref');
    const ref = readFileSync(refFile, 'utf8').trim();
    if (ref) return `https://${ref}.supabase.co`;
  } catch {
    // ignore — no linked project
  }
  return raw;
}

const supabaseUrl = getSupabaseUrl();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || supabaseUrl.includes('demo.supabase.co')) {
  console.error(
    '❌  Could not resolve Supabase URL.\n' +
    '   Set NEXT_PUBLIC_SUPABASE_URL in .env.local or link a project with `supabase link`.'
  );
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(
    '❌  SUPABASE_SERVICE_ROLE_KEY is missing.\n' +
    '   Add it to .env.local before running this script.'
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\n🌟 Creating Isla account (${ISLA_EMAIL})...\n`);
  console.log(`   URL: ${supabaseUrl}\n`);

  // 1. Check if user already exists
  const { data: existing, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.error('❌  Could not list users:', listErr.message);
    process.exit(1);
  }

  const existingUser = existing.users.find((u) => u.email === ISLA_EMAIL);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    console.log(`ℹ️  Auth user already exists (id: ${userId}). Skipping creation.`);
  } else {
    // 2. Create auth user without a password (owner sets it via dashboard)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: ISLA_EMAIL,
      email_confirm: true,
      user_metadata: { full_name: 'Isla' },
    });

    if (createErr || !created?.user) {
      console.error('❌  Failed to create auth user:', createErr?.message);
      process.exit(1);
    }

    userId = created.user.id;
    console.log(`✅  Auth user created (id: ${userId})`);
    console.log(
      `\n⚠️  No password was set. Go to:\n` +
      `   Supabase Dashboard → Authentication → Users → ${ISLA_EMAIL} → Edit\n` +
      `   and set a secure password before logging in.\n`
    );
  }

  // 3. Upsert user_profiles row (no name column — name is in auth metadata)
  const { error: profileErr } = await admin
    .from('user_profiles')
    .upsert(
      {
        user_id: userId,
        family_id: ISLA_FAMILY_ID,
        role: 'isla',
        status: 'active',
      },
      { onConflict: 'user_id' }
    );

  if (profileErr) {
    console.error('❌  Failed to upsert user_profiles:', profileErr.message);
    process.exit(1);
  }

  console.log(`✅  user_profiles row upserted (role=isla, family_id=${ISLA_FAMILY_ID})`);
  console.log('\n🎉 Isla account is ready! Her posts and comments will be auto-approved.\n');
}

main();
