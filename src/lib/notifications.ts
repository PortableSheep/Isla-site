// @ts-nocheck
import { getSbClient } from './supabaseClient';
import {
  Notification,
  NotificationCreateInput,
  NotificationQueue,
} from '@/types/notifications';
import { NotificationPreference } from '@/types/notifications';
import { sendPushToUser } from './webPush';

// Create a notification for a user
export async function createNotification(
  input: NotificationCreateInput
): Promise<Notification>  {
  const supabase = await getSbClient();
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.user_id,
      type: input.type,
      post_id: input.post_id || null,
      title: input.title,
      message: input.message,
      link: input.link,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return data as Notification;
}

// Get user's notifications
export async function getUserNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Notification[]>  {
  const supabase = await getSbClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  return (data || []) as Notification[];
}

// Get unread notification count
export async function getUnreadCount(userId: string): Promise<number>  {
  const supabase = await getSbClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    throw new Error(`Failed to get unread count: ${error.message}`);
  }

  return count || 0;
}

// Mark notification as read
export async function markAsRead(notificationId: string): Promise<void>  {
  const supabase = await getSbClient();
  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    throw new Error(`Failed to mark as read: ${error.message}`);
  }
}

// Mark all notifications as read for a user
export async function markAllAsRead(userId: string): Promise<void>  {
  const supabase = await getSbClient();
  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    throw new Error(`Failed to mark all as read: ${error.message}`);
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<void>  {
  const supabase = await getSbClient();
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    throw new Error(`Failed to delete notification: ${error.message}`);
  }
}

// Delete all notifications for a user
export async function deleteAllNotifications(userId: string): Promise<void>  {
  const supabase = await getSbClient();
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete all notifications: ${error.message}`);
  }
}

// Get notification preferences
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreference>  {
  const supabase = await getSbClient();
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch preferences: ${error.message}`);
  }

  // Return defaults if not found
  if (!data) {
    return {
      id: '',
      user_id: userId,
      email_updates: true,
      email_replies: true,
      email_children: true,
      in_app_updates: true,
      in_app_replies: true,
      in_app_children: true,
      email_frequency: 'immediate',
      digest_day: 'Monday',
      digest_time: '09:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data as NotificationPreference;
}

// Check if email should be sent based on preferences
export async function shouldSendEmail(
  userId: string,
  notificationType: 'update' | 'reply' | 'child_approved' | 'child_rejected'
): Promise<boolean>  {
  const supabase = await getSbClient();
  const prefs = await getNotificationPreferences(userId);

  // Check type-specific setting
  if (notificationType === 'update' && !prefs.email_updates) return false;
  if (notificationType === 'reply' && !prefs.email_replies) return false;
  if (
    (notificationType === 'child_approved' || notificationType === 'child_rejected') &&
    !prefs.email_children
  )
    return false;

  // Check frequency setting
  if (prefs.email_frequency === 'off') return false;

  return true;
}

// Queue email notification
export async function queueEmailNotification(
  userId: string,
  notificationId: string | null,
  notificationType: string
): Promise<NotificationQueue>  {
  const supabase = await getSbClient();
  const { data, error } = await supabase
    .from('notification_queue')
    .insert({
      user_id: userId,
      notification_id: notificationId,
      notification_type: notificationType,
      status: 'pending',
      retry_count: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to queue email: ${error.message}`);
  }

  return data as NotificationQueue;
}

// Trigger notification creation for all parents when Isla posts update
export async function createUpdateNotifications(
  postId: string,
  postContent: string,
  postAuthorId: string
): Promise<void>  {
  const supabase = await getSbClient();
  // Get all users who are parents (have role 'parent' or are family creators)
  // and have email_updates preference enabled
  const { data: parents, error: parentsError } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('role', 'parent');

  if (parentsError) {
    console.error('Failed to fetch parents:', parentsError);
    return;
  }

  if (!parents || parents.length === 0) return;

  // Also get family creators
  const { data: creators, error: creatorsError } = await supabase
    .from('families')
    .select('created_by');

  if (creatorsError) {
    console.error('Failed to fetch family creators:', creatorsError);
    return;
  }

  // Combine all parent/creator IDs (remove duplicates)
  const allParentIds = [
    ...new Set([
      ...parents.map((p: any) => p.user_id),
      ...(creators?.map((c: any) => c.created_by) || []),
    ]),
  ];

  // Create notifications for each parent
  for (const parentId of allParentIds) {
    try {
      const prefs = await getNotificationPreferences(parentId);

      // Only create notification if parent has in_app_updates enabled
      if (prefs.in_app_updates) {
        await createNotification({
          user_id: parentId,
          type: 'update',
          post_id: postId,
          title: '📢 New Update from Isla',
          message: postContent.substring(0, 100) + (postContent.length > 100 ? '...' : ''),
          link: '/wall',
        });
      }

      // Queue email if preferences allow
      if (await shouldSendEmail(parentId, 'update')) {
        // If immediate, queue for immediate send
        if (prefs.email_frequency === 'immediate') {
          await queueEmailNotification(parentId, null, 'update');
        }
        // If digest, we'll batch later
      }

      // Send push notification if enabled
      if (prefs.push_notifications_enabled) {
        const preview = postContent.substring(0, 100) + (postContent.length > 100 ? '...' : '');
        sendPushToUser(parentId, {
          title: '📢 New Update from Isla',
          body: preview,
          link: '/wall',
          tag: `update-${postId}`,
        }).catch((err) => console.error(`Push failed for user ${parentId}:`, err));
      }
    } catch (err) {
      console.error(`Failed to create notification for parent ${parentId}:`, err);
    }
  }
}

// Create reply notification
export async function notifyReplyToPost(
  postId: string,
  replyId: string
): Promise<void>  {
  const supabase = await getSbClient();
  try {
    // Get the original post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('author_id, content, parent_post_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      console.error('Failed to fetch post:', postError);
      return;
    }

    // Get the reply
    const { data: reply, error: replyError } = await supabase
      .from('posts')
      .select('author_id, content')
      .eq('id', replyId)
      .single();

    if (replyError || !reply) {
      console.error('Failed to fetch reply:', replyError);
      return;
    }

    // Don't notify if reply author is the post author (self-reply)
    if (reply.author_id === post.author_id) {
      return;
    }

    // Get reply author's profile for name (we can't access auth directly from client)
    // Use a simple naming convention: "Author" or fetch from user_profiles if available
    const { data: replyAuthorProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('user_id', reply.author_id)
      .single();

    // Build a display name from the profile/role
    let replyAuthorName = 'Someone';
    if (replyAuthorProfile && replyAuthorProfile.role) {
      const roleNames: Record<string, string> = {
        parent: 'A Parent',
        child: 'A Family Member',
        admin: 'An Admin',
        isla: 'Isla',
      };
      replyAuthorName = roleNames[replyAuthorProfile.role] || 'Someone';
    }

    const replyPreview = reply.content.substring(0, 100) + (reply.content.length > 100 ? '...' : '');
    const originalPostId = post.parent_post_id || postId; // Get root post for thread link

    // Get post author's notification preferences
    const prefs = await getNotificationPreferences(post.author_id);

    // Create in-app notification if enabled
    if (prefs.in_app_replies) {
      try {
        await createNotification({
          user_id: post.author_id,
          type: 'reply',
          post_id: postId,
          title: `${replyAuthorName} replied to your post`,
          message: replyPreview,
          link: `/wall/${originalPostId}?reply=${replyId}`,
        });
      } catch (err) {
        console.error('Failed to create in-app notification:', err);
      }
    }

    // Queue email if preferences allow
    if (await shouldSendEmail(post.author_id, 'reply')) {
      try {
        if (prefs.email_frequency === 'immediate') {
          // Queue for immediate send
          await queueEmailNotification(post.author_id, null, 'reply');
        } else if (prefs.email_frequency === 'digest') {
          // Queue for digest batching (will be processed by cron job)
          const { data: queueItem, error: queueError } = await supabase
            .from('notification_queue')
            .insert({
              user_id: post.author_id,
              notification_id: null,
              notification_type: 'reply',
              status: 'pending',
              retry_count: 0,
              thread_id: originalPostId,
              reply_id: replyId,
            })
            .select()
            .single();

          if (queueError) {
            console.error('Failed to queue reply notification:', queueError);
          }
        }
      } catch (err) {
        console.error('Failed to queue email notification:', err);
      }
    }

    // Send push notification if enabled
    if (prefs.push_notifications_enabled) {
      sendPushToUser(post.author_id, {
        title: `${replyAuthorName} replied to your post`,
        body: replyPreview,
        link: `/wall/${originalPostId}?reply=${replyId}`,
        tag: `reply-${replyId}`,
      }).catch((err) => console.error(`Push reply failed for user ${post.author_id}:`, err));
    }
  } catch (error) {
    console.error('Error in notifyReplyToPost:', error);
  }
}

// Get grouped reply notifications for digest
export async function getThreadNotifications(
  userId: string
): Promise<
  Array<{
    thread_id: string;
    post_content: string;
    replies: Array<{
      reply_id: string;
      author_role: string;
      content: string;
      created_at: string;
    }>;
  }>
> {
  const supabase = await getSbClient();
  try {
    // Get all pending reply notifications for this user from queue
    const { data: queueItems, error: queueError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('notification_type', 'reply')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (queueError) {
      console.error('Failed to fetch notification queue:', queueError);
      return [];
    }

    if (!queueItems || queueItems.length === 0) {
      return [];
    }

    // Group by thread_id
    const threadMap = new Map<string, typeof queueItems>();
    for (const item of queueItems) {
      const threadId = (item as any).thread_id || 'unknown';
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, []);
      }
      threadMap.get(threadId)!.push(item);
    }

    // Build result with author info for each reply
    const result = [];
    for (const [threadId, items] of threadMap.entries()) {
      // Get the thread post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('content')
        .eq('id', threadId)
        .single();

      if (postError || !post) continue;

      const replies = [];
      for (const item of items) {
        const replyId = (item as any).reply_id;
        if (!replyId) continue;

        // Get reply info
        const { data: reply, error: replyError } = await supabase
          .from('posts')
          .select('author_id, content, created_at')
          .eq('id', replyId)
          .single();

        if (replyError || !reply) continue;

        // Get author profile for role
        const { data: authorProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', reply.author_id)
          .single();

        const authorRole = authorProfile?.role || 'user';

        replies.push({
          reply_id: replyId,
          author_role: authorRole,
          content: reply.content.substring(0, 150),
          created_at: reply.created_at,
        });
      }

      if (replies.length > 0) {
        result.push({
          thread_id: threadId,
          post_content: post.content.substring(0, 150),
          replies,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error in getThreadNotifications:', error);
    return [];
  }
}
