import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getFlaggedPosts, searchFlaggedPosts } from '@/lib/moderation';
import { FlagStatus } from '@/types/moderation';

// Check if user is admin
async function isAdmin(supabase: import('@supabase/supabase-js').SupabaseClient, userId: string): Promise<boolean> {
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

export async function GET(request: NextRequest) {
  try {
    
    const supabase = await createClient();
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const admin = await isAdmin(supabase, user.id);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as FlagStatus | 'all' | null;
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let posts;

    // Search or filter
    if (search) {
      posts = await searchFlaggedPosts(search);
    } else {
      posts = await getFlaggedPosts(status || 'all', undefined, limit, offset);
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching flagged posts:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
