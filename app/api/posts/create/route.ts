import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { createPost } from '@/lib/posts';
import { createUpdateNotifications } from '@/lib/notifications';
import { isIslaUser } from '@/lib/islaUser';

export async function POST(request: Request) {
  try {
    
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { family_id, content, parent_post_id, is_update, is_isla_post } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Missing required field: content' },
        { status: 400 }
      );
    }

    // If this is an Isla post, verify user is Isla
    if (is_isla_post) {
      const isIsla = await isIslaUser(user.id);
      if (!isIsla) {
        return NextResponse.json(
          { error: 'Only Isla can create Isla-wide posts' },
          { status: 403 }
        );
      }

      // Isla posts have family_id = NULL
      const post = await createPost({
        family_id: null as any,
        author_id: user.id,
        content,
        parent_post_id: parent_post_id || null,
        is_update: is_update || false,
      });

      // If this is an update, create notifications for all parents
      if (is_update) {
        createUpdateNotifications(post.id, content, user.id).catch((err) => {
          console.error('Failed to create update notifications:', err);
        });
      }

      return NextResponse.json(post, { status: 201 });
    }

    // Regular family post
    if (!family_id) {
      return NextResponse.json(
        { error: 'Missing required field: family_id' },
        { status: 400 }
      );
    }

    const post = await createPost({
      family_id,
      author_id: user.id,
      content,
      parent_post_id: parent_post_id || null,
      is_update: is_update || false,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
