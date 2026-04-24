import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const ALLOWED_EMOJIS = ['❤️', '😂', '😮', '🎉', '👍', '👏', '🔥', '🥰'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const postId = typeof body?.postId === 'string' ? body.postId : null;
    const emoji = typeof body?.emoji === 'string' ? body.emoji : null;
    if (!postId || !emoji || !ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const { error } = await supabase
      .from('post_reactions')
      .upsert(
        { post_id: postId, user_id: user.id, emoji },
        { onConflict: 'post_id,user_id,emoji' }
      );

    if (error) {
      return NextResponse.json(
        { error: 'db_failed', detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'internal_error', detail },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');
    const emoji = url.searchParams.get('emoji');
    if (!postId || !emoji) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('emoji', emoji);

    if (error) {
      return NextResponse.json(
        { error: 'db_failed', detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'internal_error', detail },
      { status: 500 }
    );
  }
}
