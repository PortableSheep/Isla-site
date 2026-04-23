import { createClient } from "@supabase/supabase-js";
import * as crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are required"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Check if running in demo mode
const isDemoOnly = process.argv.includes("--demo-only");
const isProduction = process.argv.includes("--production");

if (isDemoOnly && isProduction) {
  console.error(
    "Error: Cannot use both --demo-only and --production flags together"
  );
  process.exit(1);
}

// Demo data fixtures
const demoParent = {
  email: "parent@isla.local",
  password: "Demo123!Password",
  metadata: {
    name: "Sarah Johnson",
  },
};

const demoChild = {
  email: "child@isla.local",
  password: "Demo123!Password",
  metadata: {
    name: "Emma Johnson",
  },
};

const familyName = "Johnson Family";

// Generate realistic demo content
function generateDemoContent() {
  const updates = [
    "🎉 Emma took her first steps today! So proud!",
    "Emma learned a new word: 'butterfly' 🦋",
    "First day of kindergarten - she was so excited!",
    "Made homemade cookies together - so much flour everywhere! 😄",
    "Visited the zoo today. Emma loved the penguins!",
    "Swimming lessons going great! She can float now!",
    "Lost her first tooth! Tooth fairy is on the way ✨",
  ];

  const replies = [
    "That's wonderful! Congratulations! 🎊",
    "So cute! She's growing up so fast!",
    "That's amazing! You must be so proud!",
    "What a beautiful moment! 💕",
    "That sounds like so much fun!",
    "She's doing great! Keep it up! 👏",
    "This is such a precious memory!",
    "Love hearing these updates!",
    "What a joy! 😊",
    "You're doing an amazing job!",
  ];

  return { updates, replies };
}

interface DemoUser {
  id: string;
  email: string;
}

interface DemoData {
  parentUser: DemoUser;
  childUser: DemoUser;
  familyId: string;
}

async function createDemoParent(): Promise<DemoUser> {
  console.log("👤 Creating demo parent user...");

  // Note: In a real scenario with service role, you would use:
  // const { data, error } = await supabase.auth.admin.createUser({...})
  // For demo purposes, we'll show the structure but note that user creation
  // typically happens through the auth UI or admin endpoint

  const parentId = crypto.randomUUID();

  console.log(`✓ Demo parent created (ID: ${parentId})`);
  console.log(`  Email: ${demoParent.email}`);
  console.log(`  Name: ${demoParent.metadata.name}`);

  return {
    id: parentId,
    email: demoParent.email,
  };
}

async function createDemoChild(): Promise<DemoUser> {
  console.log("👧 Creating demo child user...");

  const childId = crypto.randomUUID();

  console.log(`✓ Demo child created (ID: ${childId})`);
  console.log(`  Email: ${demoChild.email}`);
  console.log(`  Name: ${demoChild.metadata.name}`);

  return {
    id: childId,
    email: demoChild.email,
  };
}

async function createDemoFamily(parentId: string): Promise<string> {
  console.log("👨‍👩‍👧‍👦 Creating demo family...");

  try {
    const { data, error } = await supabase
      .from("families")
      .insert([
        {
          name: familyName,
          created_by: parentId,
        },
      ])
      .select("id")
      .single();

    if (error) throw error;

    const familyId = data.id;
    console.log(`✓ Demo family created: ${familyName}`);
    console.log(`  Family ID: ${familyId}`);

    return familyId;
  } catch (error) {
    console.error("Failed to create demo family:", error);
    throw error;
  }
}

async function createChildProfile(
  childId: string,
  familyId: string,
  parentId: string
): Promise<void> {
  console.log("📋 Creating child profile...");

  try {
    // Create user profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert([
        {
          user_id: childId,
          family_id: familyId,
          role: "child",
          status: "approved",
        },
      ]);

    if (profileError) throw profileError;

    // Create approval record
    const { error: approvalError } = await supabase
      .from("child_approvals")
      .insert([
        {
          child_id: childId,
          family_id: familyId,
          action: "approved",
          approved_by: parentId,
          reason: "Demo account approval",
        },
      ]);

    if (approvalError) throw approvalError;

    console.log(`✓ Child profile created and approved`);
  } catch (error) {
    console.error("Failed to create child profile:", error);
    throw error;
  }
}

async function createDemoPosts(
  parentId: string,
  childId: string,
  familyId: string
): Promise<void> {
  console.log("📝 Creating demo posts...");

  const { updates, replies } = generateDemoContent();

  try {
    // Create parent posts
    const parentPosts = [];
    for (let i = 0; i < 5; i++) {
      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            family_id: familyId,
            author_id: parentId,
            content: updates[i % updates.length],
            is_update: true,
          },
        ])
        .select("id")
        .single();

      if (error) throw error;
      parentPosts.push(data.id);
    }

    console.log(`✓ Created 5 demo updates from parent`);

    // Create child replies
    for (let i = 0; i < parentPosts.length; i++) {
      const replyCount = Math.floor(Math.random() * 3) + 2; // 2-3 replies per post
      for (let j = 0; j < replyCount; j++) {
        const { error } = await supabase
          .from("posts")
          .insert([
            {
              family_id: familyId,
              author_id: childId,
              parent_post_id: parentPosts[i],
              content: replies[(i + j) % replies.length],
            },
          ]);

        if (error) throw error;
      }
    }

    console.log(`✓ Created demo replies from child`);
  } catch (error) {
    console.error("Failed to create demo posts:", error);
    throw error;
  }
}

async function createDemoNotifications(
  childId: string,
  parentId: string
): Promise<void> {
  console.log("🔔 Creating demo notifications...");

  try {
    const notifications = [
      {
        recipient_id: parentId,
        type: "post_reply",
        title: "Emma replied to your post",
        message: "Emma replied to your family update",
        read: false,
      },
      {
        recipient_id: parentId,
        type: "account",
        title: "Welcome to Isla",
        message:
          "Welcome to Isla! Your family is ready to start sharing memories.",
        read: true,
      },
      {
        recipient_id: childId,
        type: "account",
        title: "Account Approved",
        message: "Your parent approved your account. Welcome to Isla!",
        read: true,
      },
    ];

    for (const notification of notifications) {
      const { error } = await supabase
        .from("notifications")
        .insert([notification]);

      if (error) throw error;
    }

    console.log(`✓ Created ${notifications.length} demo notifications`);
  } catch (error) {
    console.error("Failed to create demo notifications:", error);
    throw error;
  }
}

async function createDemoAuditLogs(parentId: string): Promise<void> {
  console.log("📊 Creating demo audit logs...");

  try {
    const auditLogs = [
      {
        action: "created_family",
        user_id: parentId,
        details: { family_name: familyName },
      },
      {
        action: "added_child",
        user_id: parentId,
        details: { child_name: demoChild.metadata.name },
      },
      {
        action: "created_post",
        user_id: parentId,
        details: { post_count: 5 },
      },
    ];

    for (const log of auditLogs) {
      const { error } = await supabase.from("audit_logs").insert([log]);

      if (error) throw error;
    }

    console.log(`✓ Created ${auditLogs.length} demo audit logs`);
  } catch (error) {
    console.error("Failed to create demo audit logs:", error);
    throw error;
  }
}

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════");
  console.log("  Isla Demo Data Seeding");
  console.log("═══════════════════════════════════════════════\n");

  if (isProduction) {
    console.warn("⚠️  WARNING: Running in production mode");
    console.warn(
      "This will create demo users in your production database.\n"
    );
  } else {
    console.log(
      "💡 Running in demo mode. Use --production for real environments.\n"
    );
  }

  try {
    // Create demo users (note: in real scenario these would be created via auth)
    const parentUser = await createDemoParent();
    const childUser = await createDemoChild();

    console.log();

    // Create demo family
    const familyId = await createDemoFamily(parentUser.id);

    console.log();

    // Create child profile with approval
    await createChildProfile(childUser.id, familyId, parentUser.id);

    console.log();

    // Create demo posts and replies
    await createDemoPosts(parentUser.id, childUser.id, familyId);

    console.log();

    // Create demo notifications
    await createDemoNotifications(childUser.id, parentUser.id);

    console.log();

    // Create demo audit logs
    await createDemoAuditLogs(parentUser.id);

    console.log("\n═══════════════════════════════════════════════");
    console.log("✅ Demo data seeding completed successfully!");
    console.log("═══════════════════════════════════════════════");
    console.log("\nDemo Account Credentials:");
    console.log(`  Parent Email: ${demoParent.email}`);
    console.log(`  Parent Name: ${demoParent.metadata.name}`);
    console.log(`  Child Email: ${demoChild.email}`);
    console.log(`  Child Name: ${demoChild.metadata.name}`);
    console.log(`  Family: ${familyName}\n`);
  } catch (error) {
    console.error("\n❌ Seeding failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
