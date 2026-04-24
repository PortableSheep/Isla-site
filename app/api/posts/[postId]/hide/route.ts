// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { hidePost, unhidePost } from '@/lib/posts';

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
    const { hidden, reason, reason_text } = body;

    // Verify admin status
    const post = await supabase
      .from('posts')
      .select('family_id')
      .eq('id', postId)
      .single();

    if (post.error || !post.data) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const family = await supabase
      .from('families')
      .select('created_by')
      .eq('id', post.data.family_id)
      .single();

    if (family.error || family.data?.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only family admins can hide posts' },
        { status: 403 }
      );
    }

    if (hidden) {
      await hidePost(postId, reason, reason_text);
    } else {
      await unhidePost(postId);
    }

    return NextResponse.json({
      message: hidden ? 'Post hidden' : 'Post unhidden',
    });
  } catch (error) {
    console.error('Error hiding post:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
