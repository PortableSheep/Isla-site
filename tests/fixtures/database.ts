import { SupabaseClient } from '@supabase/supabase-js';
import {
  generateParentUser,
  generateChildProfile,
  generateFamilyData,
  generateNotificationPreferences,
} from './data-factory';

/**
 * Reset database by clearing all test data
 */
export async function resetTestDatabase(supabase: SupabaseClient): Promise<void> {
  try {
    // Delete in order of dependencies to avoid foreign key constraints
    await supabase.from('post_flags').delete().match({});
    await supabase.from('notifications').delete().match({});
    await supabase.from('notification_preferences').delete().match({});
    await supabase.from('notification_queue').delete().match({});
    await supabase.from('posts').delete().match({});
    await supabase.from('child_profiles').delete().match({});
    await supabase.from('family_invites').delete().match({});
    await supabase.from('family_members').delete().match({});
    await supabase.from('families').delete().match({});

    console.log('✓ Test database reset');
  } catch (error) {
    console.error('Error resetting test database:', error);
    throw error;
  }
}

/**
 * Create a test parent user with auth account
 */
export async function createTestParent(
  supabase: SupabaseClient,
  authAdmin: SupabaseClient,
): Promise<{ user_id: string; email: string; password: string }> {
  const parentData = generateParentUser();

  // Create auth user
  const { data: authData, error: authError } = await authAdmin.auth.admin.createUser({
    email: parentData.email,
    password: parentData.password,
    email_confirm: true,
    user_metadata: {
      role: 'parent',
    },
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create parent auth user: ${authError?.message}`);
  }

  return {
    user_id: authData.user.id,
    email: parentData.email,
    password: parentData.password,
  };
}

/**
 * Create a test child profile
 */
export async function createTestChild(
  supabase: SupabaseClient,
  parentId: string,
  familyId?: string,
): Promise<{ id: string; name: string }> {
  const childData = generateChildProfile();

  const { data, error } = await supabase
    .from('child_profiles')
    .insert({
      parent_id: parentId,
      family_id: familyId || null,
      name: childData.name,
      age: childData.age,
      bio: childData.bio,
      status: 'active',
      email: null,
      approved_at: new Date().toISOString(),
      approved_by: parentId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create child profile: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
  };
}

/**
 * Create a test family
 */
export async function createTestFamily(
  supabase: SupabaseClient,
  parentId: string,
): Promise<string> {
  const familyData = generateFamilyData();

  const { data, error } = await supabase
    .from('families')
    .insert({
      name: familyData.name,
      created_by: parentId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create family: ${error.message}`);
  }

  // Add parent as family member
  await supabase.from('family_members').insert({
    family_id: data.id,
    user_id: parentId,
    role: 'admin',
  });

  return data.id;
}

/**
 * Create a test post
 */
export async function createTestPost(
  supabase: SupabaseClient,
  authorId: string,
  familyId?: string,
  parentPostId?: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      family_id: familyId || null,
      author_id: authorId,
      content: `Test post at ${new Date().toISOString()}`,
      parent_post_id: parentPostId || null,
      hidden: false,
      flagged: false,
      flag_count: 0,
      is_update: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  return data.id;
}

/**
 * Create test notification preferences
 */
export async function createTestNotificationPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const prefs = generateNotificationPreferences();

  const { error } = await supabase.from('notification_preferences').insert({
    user_id: userId,
    ...prefs,
  });

  if (error) {
    throw new Error(`Failed to create notification preferences: ${error.message}`);
  }
}

/**
 * Create a test notification
 */
export async function createTestNotification(
  supabase: SupabaseClient,
  userId: string,
  postId?: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'update',
      post_id: postId || null,
      title: 'Test Notification',
      message: `Test notification at ${new Date().toISOString()}`,
      read: false,
      link: '/dashboard',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return data.id;
}

/**
 * Set up a complete test scenario with parent, children, family, and posts
 */
export async function setupCompleteTestScenario(
  supabase: SupabaseClient,
  authAdmin: SupabaseClient,
  numChildren: number = 2,
): Promise<{
  parentId: string;
  parentEmail: string;
  parentPassword: string;
  familyId: string;
  childrenIds: string[];
  postIds: string[];
}> {
  // Create parent
  const parent = await createTestParent(supabase, authAdmin);

  // Create family
  const familyId = await createTestFamily(supabase, parent.user_id);

  // Create children
  const childrenIds: string[] = [];
  for (let i = 0; i < numChildren; i++) {
    const child = await createTestChild(supabase, parent.user_id, familyId);
    childrenIds.push(child.id);
  }

  // Create posts
  const postIds: string[] = [];
  for (const childId of childrenIds) {
    const postId = await createTestPost(supabase, childId, familyId);
    postIds.push(postId);

    // Create a reply
    const replyId = await createTestPost(supabase, parent.user_id, familyId, postId);
    postIds.push(replyId);
  }

  // Create notification preferences
  await createTestNotificationPreferences(supabase, parent.user_id);

  // Create some notifications
  for (const postId of postIds) {
    await createTestNotification(supabase, parent.user_id, postId);
  }

  return {
    parentId: parent.user_id,
    parentEmail: parent.email,
    parentPassword: parent.password,
    familyId,
    childrenIds,
    postIds,
  };
}
