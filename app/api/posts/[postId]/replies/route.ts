// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getThreadReplies, createPost } from '@/lib/posts';
import { notifyReplyToPost } from '@/lib/notifications';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const replies = await getThreadReplies(postId);

    return NextResponse.json({ replies });
  } catch (error) {
    console.error('Error fetching replies:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      );
    }

    // Get the parent post to get family_id
    const parentPost = await supabase
      .from('posts')
      .select('family_id')
      .eq('id', postId)
      .single();

    if (parentPost.error || !parentPost.data) {
      return NextResponse.json({ error: 'Parent post not found' }, { status: 404 });
    }

    const reply = await createPost({
      family_id: parentPost.data.family_id,
      author_id: user.id,
      content,
      parent_post_id: postId,
    });

    // Trigger reply notification asynchronously (don't block response)
    notifyReplyToPost(postId, reply.id).catch((err) => {
      console.error('Error triggering reply notification:', err);
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error('Error creating reply:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
