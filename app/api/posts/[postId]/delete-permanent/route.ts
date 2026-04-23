// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { permanentlyDeletePost } from '@/lib/posts';

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

    // Check if user is admin
    const userProfile = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userProfile.error || userProfile.data?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can permanently delete posts' },
        { status: 403 }
      );
    }

    const { postId } = await params;

    // Get the post first to verify it exists
    const post = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (post.error || !post.data) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await permanentlyDeletePost(postId);

    return NextResponse.json({ message: 'Post permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting post:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
