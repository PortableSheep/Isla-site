// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { deletePost } from '@/lib/posts';

export async function DELETE(
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
    const { reason, reason_text } = body;

    // Get the post
    const post = await supabase
      .from('posts')
      .select('author_id, family_id, is_update')
      .eq('id', postId)
      .single();

    if (post.error || !post.data) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isOwner = post.data.author_id === user.id;

    // For updates, check if user is Isla/author
    if (post.data.is_update) {
      if (!isOwner) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      // For regular posts, check owner or family admin
      const family = await supabase
        .from('families')
        .select('created_by')
        .eq('id', post.data.family_id)
        .single();

      const isAdmin = family.data?.created_by === user.id;

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Check if already deleted
    if (post.data.deleted_at) {
      return NextResponse.json(
        { error: 'Post is already deleted' },
        { status: 400 }
      );
    }

    await deletePost(postId, reason, reason_text);

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
