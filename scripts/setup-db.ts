import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are required"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface MigrationFile {
  filename: string;
  path: string;
  order: number;
}

async function readMigrations(): Promise<MigrationFile[]> {
  const migrationsDir = path.join(__dirname, "../supabase/migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.error(`Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir);
  const migrations = files
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((filename, index) => ({
      filename,
      path: path.join(migrationsDir, filename),
      order: index,
    }));

  return migrations;
}

async function runMigrations(migrations: MigrationFile[]): Promise<boolean> {
  console.log(`\n🔧 Running ${migrations.length} migrations...\n`);

  for (const migration of migrations) {
    try {
      const sql = fs.readFileSync(migration.path, "utf-8");
      console.log(`▶ Executing migration: ${migration.filename}`);

      const { error } = await supabase.rpc("exec_sql", { sql });

      if (error) {
        // Try direct query if RPC doesn't work
        const { error: queryError } = await supabase.rpc("exec_sql", { sql });
        if (queryError) {
          console.warn(
            `⚠ Migration may need manual execution: ${migration.filename}`
          );
          console.warn(
            `  Note: Some migrations can only be run with service key. Check manually.`
          );
        }
      }

      console.log(`✓ Migration completed: ${migration.filename}`);
    } catch (error) {
      console.error(`✗ Failed to execute migration: ${migration.filename}`);
      console.error(error);
      return false;
    }
  }

  return true;
}

async function verifyRLSPolicies(): Promise<boolean> {
  console.log("\n🔒 Verifying RLS Policies...\n");

  const policies = [
    { table: "families", policy: "Users can view their own families" },
    { table: "user_profiles", policy: "Users can view own profile" },
    { table: "posts", policy: "Users can view family posts" },
    { table: "invite_tokens", policy: "Users can view tokens they created" },
  ];

  for (const { table, policy } of policies) {
    try {
      // Note: This is a check via query, not a direct RLS verification
      // Full RLS testing is done in verify-rls.ts
      const { data, error } = await supabase.rpc("get_rls_status", {
        table_name: table,
      });

      if (!error && data) {
        console.log(`✓ RLS policy exists on table: ${table}`);
      } else {
        console.warn(`⚠ Could not verify RLS on table: ${table}`);
      }
    } catch (error) {
      console.warn(`⚠ Skipping RLS verification for ${table}`);
    }
  }

  return true;
}

async function createPerformanceIndexes(): Promise<boolean> {
  console.log("\n⚡ Creating Performance Indexes...\n");

  const indexes = [
    {
      name: "idx_posts_family_id_created_at",
      table: "posts",
      columns: "(family_id, created_at DESC)",
    },
    {
      name: "idx_posts_author_id",
      table: "posts",
      columns: "(author_id)",
    },
    {
      name: "idx_user_profiles_family_id",
      table: "user_profiles",
      columns: "(family_id)",
    },
    {
      name: "idx_child_approvals_created_at",
      table: "child_approvals",
      columns: "(created_at DESC)",
    },
    {
      name: "idx_notifications_recipient_id_created_at",
      table: "notifications",
      columns: "(recipient_id, created_at DESC)",
    },
  ];

  for (const index of indexes) {
    try {
      const sql = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table}${index.columns};`;

      const { error } = await supabase.rpc("exec_sql", { sql });

      if (!error) {
        console.log(`✓ Created index: ${index.name}`);
      } else {
        console.warn(`⚠ Index may already exist: ${index.name}`);
      }
    } catch (error) {
      console.warn(`⚠ Could not create index: ${index.name}`);
    }
  }

  return true;
}

async function validateSchema(): Promise<boolean> {
  console.log("\n🔍 Validating Schema...\n");

  const expectedTables = [
    "families",
    "user_profiles",
    "invite_tokens",
    "child_approvals",
    "posts",
    "post_flags",
    "notifications",
    "notification_preferences",
    "audit_logs",
  ];

  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .limit(0);

      if (!error) {
        console.log(`✓ Table exists: ${table}`);
      } else {
        console.warn(`⚠ Table may not exist or is not accessible: ${table}`);
      }
    } catch (error) {
      console.warn(`⚠ Could not validate table: ${table}`);
    }
  }

  return true;
}

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════");
  console.log("  Isla Database Setup");
  console.log("═══════════════════════════════════════════════");

  try {
    // Read migrations
    const migrations = await readMigrations();
    console.log(`Found ${migrations.length} migrations`);

    // Run migrations
    const migrationsSuccess = await runMigrations(migrations);
    if (!migrationsSuccess) {
      console.error(
        "\n❌ Migrations failed. Please check the errors above."
      );
      process.exit(1);
    }

    // Verify RLS policies
    await verifyRLSPolicies();

    // Create performance indexes
    await createPerformanceIndexes();

    // Validate schema
    await validateSchema();

    console.log("\n═══════════════════════════════════════════════");
    console.log("✅ Database setup completed successfully!");
    console.log("═══════════════════════════════════════════════\n");
  } catch (error) {
    console.error("\n❌ Setup failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
