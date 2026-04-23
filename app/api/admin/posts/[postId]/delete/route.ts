import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { deletePost } from '@/lib/moderation';

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return (data as { role: string } | null)?.role === 'admin';
  } catch (error) {
    console.error('Error in isAdmin:', error);
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const admin = await isAdmin(user.id);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { postId } = await params;

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete the post (soft delete)
    await deletePost(postId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
