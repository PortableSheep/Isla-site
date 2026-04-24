// @ts-nocheck
import { getSbClient } from './supabaseClient';
import { Post, PostFlag, PostCreateInput, PostUpdateInput, PostWithReplies } from '@/types/posts';

const MAX_CONTENT_LENGTH = 5000;

// Validate post content
function validateContent(content: string): string {
  if (!content || typeof content !== 'string') {
    throw new Error('Content is required');
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    throw new Error('Content cannot be empty');
  }

  if (trimmed.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Content cannot exceed ${MAX_CONTENT_LENGTH} characters`);
  }

  return trimmed;
}

// Create a new post
export async function createPost(input: PostCreateInput): Promise<Post>  {
  const supabase = await getSbClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const content = validateContent(input.content);

  const { data, error } = await supabase
    .from('posts')
    .insert({
      family_id: input.family_id,
      author_id: input.author_id,
      content,
      parent_post_id: input.parent_post_id || null,
      is_update: input.is_update || false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  return data as Post;
}

// Get posts for a family feed (includes Isla-wide posts)
export async function getPostsByFamily(
  familyId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Post[]>  {
  const supabase = await getSbClient();
  const { data, error } = await supabase
    .from('posts')
    .select()
    .or(`family_id.eq.${familyId},family_id.is.null`)
    .is('parent_post_id', null)
    .is('deleted_at', null)
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }

  return (data || []) as Post[];
}

// Get all replies to a post (thread)
export async function getThreadReplies(parentPostId: string): Promise<Post[]>  {
  const supabase = await getSbClient();
  const { data, error } = await supabase
    .from('posts')
    .select()
    .eq('parent_post_id', parentPostId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch thread replies: ${error.message}`);
  }

  return (data || []) as Post[];
}

// Get a single post
export async function getPost(postId: string): Promise<Post | null>  {
  const supabase = await getSbClient();
  const { data, error } = await supabase
    .from('posts')
    .select()
    .eq('id', postId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch post: ${error.message}`);
  }

  return (data as Post) || null;
}

// Get a post with all its replies
export async function getPostWithReplies(postId: string): Promise<PostWithReplies | null>  {
  const supabase = await getSbClient();
  const post = await getPost(postId);
  if (!post) {
    return null;
  }

  const replies = await getThreadReplies(postId);

  return {
    ...post,
    replies,
  };
}

// Update a post (content only)
export async function updatePost(postId: string, input: PostUpdateInput): Promise<Post>  {
  const supabase = await getSbClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const content = validateContent(input.content);

  const { data, error } = await supabase
    .from('posts')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }

  return data as Post;
}

// Soft delete a post with reason tracking (mark as deleted)
export async function deletePost(postId: string, reason?: string, reasonText?: string): Promise<void>  {
  const supabase = await getSbClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const deleteData: any = {
    deleted_at: new Date().toISOString(),
    deleted_by: user.id,
  };

  if (reason) {
    deleteData.deleted_reason = reason;
  }
  if (reasonText) {
    deleteData.deleted_reason_text = reasonText;
  }

  const { error } = await supabase
    .from('posts')
    .update(deleteData)
    .eq('id', postId);

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }

  // Log the action
  await createAuditLog({
    action: 'delete',
    actor_id: user.id,
    post_id: postId,
    reason: reason || 'Manual deletion',
  });
}

// Hard delete a post (admin only)
export async function permanentlyDeletePost(postId: string): Promise<void>  {
  const supabase = await getSbClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) {
    throw new Error(`Failed to permanently delete post: ${error.message}`);
  }

  // Log the action
  await createAuditLog({
    action: 'permanent_delete',
    actor_id: user.id,
    post_id: postId,
    reason: 'Permanent hard delete',
  });
}

// Create an audit log entry
export async function createAuditLog(data: {
  action: 'delete' | 'hide' | 'unhide' | 'report' | 'permanent_delete';
  actor_id: string;
  post_id?: string | null;
  reason?: string | null;
}): Promise<void>  {
  const supabase = await getSbClient();
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      action: data.action,
      actor_id: data.actor_id,
      post_id: data.post_id || null,
      reason: data.reason || null,
    });

  if (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging shouldn't fail the main operation
  }
}

// Get audit logs for a post
export async function getPostAuditLogs(postId: string): Promise<Array<any>>  {
  const supabase = await getSbClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select()
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }

  return (data || []) as Array<any>;
}

// Flag a post for moderation
export async function flagPost(
  postId: string,
  reason: string,
  flaggedBy: string
): Promise<PostFlag>  {
  const supabase = await getSbClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    throw new Error('Flag reason is required');
  }

  // Create the flag record
  const { data, error } = await supabase
    .from('post_flags')
    .insert({
      post_id: postId,
      flagged_by: flaggedBy,
      reason: reason.trim(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to flag post: ${error.message}`);
  }

  // Update the flag count and flagged status on the post
  const currentPost = await getPost(postId);
  if (currentPost) {
    const newFlagCount = currentPost.flag_count + 1;
    await supabase
      .from('posts')
      .update({
        flag_count: newFlagCount,
        flagged: true,
      })
      .eq('id', postId);
  }

  return data as PostFlag;
}

// Hide a post (moderator action) with reason tracking
export async function hidePost(postId: string, reason?: string, reasonText?: string): Promise<void>  {
  const supabase = await getSbClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const hideData: any = {
    hidden: true,
    hidden_at: new Date().toISOString(),
    hidden_by: user.id,
  };

  if (reason) {
    hideData.hidden_reason = reason;
  }
  if (reasonText) {
    hideData.hidden_reason_text = reasonText;
  }

  const { error } = await supabase
    .from('posts')
    .update(hideData)
    .eq('id', postId);

  if (error) {
    throw new Error(`Failed to hide post: ${error.message}`);
  }

  // Log the action
  await createAuditLog({
    action: 'hide',
    actor_id: user.id,
    post_id: postId,
    reason: reason || 'Manual hide',
  });
}

// Unhide a post (moderator action)
export async function unhidePost(postId: string): Promise<void>  {
  const supabase = await getSbClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('posts')
    .update({
      hidden: false,
      hidden_reason: null,
      hidden_reason_text: null,
      hidden_by: null,
      hidden_at: null,
    })
    .eq('id', postId);

  if (error) {
    throw new Error(`Failed to unhide post: ${error.message}`);
  }

  // Log the action
  await createAuditLog({
    action: 'unhide',
    actor_id: user.id,
    post_id: postId,
    reason: 'Post unhidden',
  });
}

// Get flags for a post
export async function getPostFlags(postId: string): Promise<PostFlag[]>  {
  const supabase = await getSbClient();
  const { data, error } = await supabase
    .from('post_flags')
    .select()
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch post flags: ${error.message}`);
  }

  return (data || []) as PostFlag[];
}

// Update flag status
export async function updateFlagStatus(
  flagId: string,
  status: 'pending' | 'reviewed' | 'dismissed'
): Promise<void>  {
  const supabase = await getSbClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('post_flags')
    .update({ status })
    .eq('id', flagId);

  if (error) {
    throw new Error(`Failed to update flag status: ${error.message}`);
  }
}

// Create a reply to a post
export async function createReply(
  parentPostId: string,
  content: string
): Promise<Post>  {
  const supabase = await getSbClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Verify parent post exists and is not deleted
  const parentPost = await getPost(parentPostId);
  if (!parentPost) {
    throw new Error('Parent post not found or deleted');
  }

  // Validate reply content
  const MAX_REPLY_LENGTH = 2000;
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error('Reply content cannot be empty');
  }
  if (trimmedContent.length > MAX_REPLY_LENGTH) {
    throw new Error(`Reply cannot exceed ${MAX_REPLY_LENGTH} characters`);
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      family_id: parentPost.family_id,
      author_id: user.id,
      content: trimmedContent,
      parent_post_id: parentPostId,
      is_update: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create reply: ${error.message}`);
  }

  return data as Post;
}

// Get replies for a post with author info
export async function getRepliesWithAuthors(postId: string): Promise<
  (Post & { author?: { name?: string; email?: string; role?: 'parent' | 'child' | 'admin' } })[]
> {
  const supabase = await getSbClient();
  const replies = await getThreadReplies(postId);

  // Fetch user profiles for each reply
  const repliesWithAuthors = await Promise.all(
    replies.map(async (reply) => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('id, name, email, role')
          .eq('user_id', reply.author_id)
          .single();

        return {
          ...reply,
          author: data || undefined,
        };
      } catch {
        return reply;
      }
    })
  );

  return repliesWithAuthors;
}

// Delete a reply (with ownership check)
export async function deleteReply(replyId: string): Promise<void>  {
  const supabase = await getSbClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const reply = await getPost(replyId);
  if (!reply) {
    throw new Error('Reply not found');
  }

  if (reply.author_id !== user.id) {
    throw new Error('You can only delete your own replies');
  }

  await deletePost(replyId);
}

// Flag a reply for moderation
export async function flagReply(replyId: string, reason: string): Promise<PostFlag>  {
  const supabase = await getSbClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const reply = await getPost(replyId);
  if (!reply) {
    throw new Error('Reply not found');
  }

  if (!reply.parent_post_id) {
    throw new Error('Post is not a reply');
  }

  return await flagPost(replyId, reason, user.id);
}

// Get all updates (Isla-wide announcements)
export async function getUpdates(limit: number = 50, offset: number = 0): Promise<Post[]>  {
  const supabase = await getSbClient();
  const { data, error } = await supabase
    .from('posts')
    .select()
    .eq('is_update', true)
    .is('deleted_at', null)
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch updates: ${error.message}`);
  }

  return (data || []) as Post[];
}

// Get a single update
export async function getUpdate(updateId: string): Promise<Post | null>  {
  const supabase = await getSbClient();
  const post = await getPost(updateId);
  if (!post || !post.is_update) {
    return null;
  }
  return post;
}

// Search updates by content
export async function searchUpdates(query: string, limit: number = 50): Promise<Post[]>  {
  const supabase = await getSbClient();
  if (!query || query.trim().length === 0) {
    return getUpdates(limit);
  }

  const { data, error } = await supabase
    .from('posts')
    .select()
    .eq('is_update', true)
    .is('deleted_at', null)
    .eq('hidden', false)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search updates: ${error.message}`);
  }

  return (data || []) as Post[];
}
