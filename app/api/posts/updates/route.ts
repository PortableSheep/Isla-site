import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUpdates, searchUpdates } from '@/lib/posts';

export async function GET(request: NextRequest) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    if (limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Limit must be between 1 and 100' }, { status: 400 });
    }

    if (offset < 0) {
      return NextResponse.json({ error: 'Offset must be non-negative' }, { status: 400 });
    }

    let updates;
    if (search && search.trim()) {
      updates = await searchUpdates(search, limit);
    } else {
      updates = await getUpdates(limit, offset);
    }

    return NextResponse.json(updates);
  } catch (error) {
    console.error('Error fetching updates:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
