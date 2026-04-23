// @ts-nocheck
import { supabase } from './supabase';
import { FlagStatus, FlaggedPostData, ModerationStats, ModFlag } from '@/types/moderation';
import { logAction } from './auditLog';

// Get flagged posts with optional filtering
export async function getFlaggedPosts(
  status?: FlagStatus | 'all',
  familyId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<FlaggedPostData[]> {
  try {
    let query = supabase
      .from('posts')
      .select(`
        id,
        family_id,
        author_id,
        content,
        created_at,
        updated_at,
        hidden,
        flagged,
        flag_count,
        post_flags (
          id,
          post_id,
          flagged_by,
          reason,
          created_at,
          status
        )
      `)
      .eq('flagged', true)
      .order('created_at', { ascending: false, referencedTable: 'post_flags' })
      .order('created_at', { ascending: false });

    if (familyId) {
      query = query.eq('family_id', familyId);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch flagged posts: ${error.message}`);
    }

    // Filter by flag status if specified
    if (status && status !== 'all') {
      return ((data || []) as any[]).filter(post => 
        (post.post_flags as ModFlag[])?.some((flag: ModFlag) => flag.status === status)
      );
    }

    return (data || []) as FlaggedPostData[];
  } catch (error) {
    console.error('Error fetching flagged posts:', error);
    throw error;
  }
}

// Get a single post with all its flags
export async function getPostWithFlags(postId: string): Promise<FlaggedPostData | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        family_id,
        author_id,
        content,
        created_at,
        updated_at,
        hidden,
        flagged,
        flag_count,
        post_flags (
          id,
          post_id,
          flagged_by,
          reason,
          created_at,
          status
        )
      `)
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Error fetching post with flags:', error);
      return null;
    }

    return data as FlaggedPostData;
  } catch (error) {
    console.error('Error in getPostWithFlags:', error);
    return null;
  }
}

// Get a single flag
export async function getFlag(flagId: string): Promise<ModFlag | null> {
  try {
    const { data, error } = await supabase
      .from('post_flags')
      .select('*')
      .eq('id', flagId)
      .single();

    if (error) {
      console.error('Error fetching flag:', error);
      return null;
    }

    return data as ModFlag;
  } catch (error) {
    console.error('Error in getFlag:', error);
    return null;
  }
}

// Update flag status
export async function updateFlagStatus(flagId: string, newStatus: FlagStatus): Promise<ModFlag | null> {
  try {
    const { data, error } = await supabase
      .from('post_flags')
      .update({ status: newStatus })
      .eq('id', flagId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update flag status: ${error.message}`);
    }

    return data as ModFlag;
  } catch (error) {
    console.error('Error updating flag status:', error);
    throw error;
  }
}

// Update multiple flags status (for a post)
export async function updatePostFlagsStatus(postId: string, newStatus: FlagStatus): Promise<void> {
  try {
    const { error } = await supabase
      .from('post_flags')
      .update({ status: newStatus } as any)
      .eq('post_id', postId);

    if (error) {
      throw new Error(`Failed to update post flags: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating post flags:', error);
    throw error;
  }
}

// Get moderation statistics
export async function getModerationStats(): Promise<ModerationStats> {
  try {
    // Count by status
    const { count: totalCount, error: totalError } = await supabase
      .from('post_flags')
      .select('*', { count: 'exact', head: true });

    const { count: pendingCount, error: pendingError } = await supabase
      .from('post_flags')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: reviewedCount, error: reviewedError } = await supabase
      .from('post_flags')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'reviewed');

    const { count: dismissedCount, error: dismissedError } = await supabase
      .from('post_flags')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'dismissed');

    if (totalError || pendingError || reviewedError || dismissedError) {
      console.error('Error fetching stats:', {
        totalError,
        pendingError,
        reviewedError,
        dismissedError,
      });
      throw new Error('Failed to fetch moderation statistics');
    }

    return {
      total_flags: totalCount || 0,
      pending_flags: pendingCount || 0,
      reviewed_flags: reviewedCount || 0,
      dismissed_flags: dismissedCount || 0,
    };
  } catch (error) {
    console.error('Error in getModerationStats:', error);
    throw error;
  }
}

// Count pending flags
export async function countPendingFlags(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('post_flags')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      throw new Error(`Failed to count pending flags: ${error.message}`);
    }

    return count || 0;
  } catch (error) {
    console.error('Error counting pending flags:', error);
    return 0;
  }
}

// Hide a post (admin action)
export async function hidePost(postId: string, reason?: string, actorId?: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ hidden: true, hidden_at: new Date().toISOString() })
      .eq('id', postId);

    if (error) {
      throw new Error(`Failed to hide post: ${error.message}`);
    }

    // Log action asynchronously
    if (actorId) {
      logAction('post_hidden', actorId, 'post', postId, reason);
    }
  } catch (error) {
    console.error('Error hiding post:', error);
    throw error;
  }
}

// Delete a post (admin action - soft delete)
export async function deletePost(postId: string, reason?: string, actorId?: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', postId);

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }

    // Log action asynchronously
    if (actorId) {
      logAction('post_deleted', actorId, 'post', postId, reason);
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// Search flagged posts by content
export async function searchFlaggedPosts(query: string): Promise<FlaggedPostData[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        family_id,
        author_id,
        content,
        created_at,
        updated_at,
        hidden,
        flagged,
        flag_count,
        post_flags (
          id,
          post_id,
          flagged_by,
          reason,
          created_at,
          status
        )
      `)
      .eq('flagged', true)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search flagged posts: ${error.message}`);
    }

    return (data || []) as FlaggedPostData[];
  } catch (error) {
    console.error('Error searching flagged posts:', error);
    throw error;
  }
}
