// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPostWithReplies, updatePost, deletePost } from '@/lib/posts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const post = await getPostWithReplies(postId);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
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
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Verify ownership
    const post = await supabase
      .from('posts')
      .select()
      .eq('id', postId)
      .single();

    if (post.error || !post.data || post.data.author_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized or post not found' }, { status: 403 });
    }

    const updatedPost = await updatePost(postId, { content });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;

    // Verify ownership or admin status
    const post = await supabase
      .from('posts')
      .select('author_id, family_id, is_update')
      .eq('id', postId)
      .single();

    if (post.error || !post.data) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isOwner = post.data.author_id === user.id;

    // For updates, check if user is Isla
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

    await deletePost(postId);

    return NextResponse.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
