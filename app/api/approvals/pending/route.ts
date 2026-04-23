import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPendingChildren, getApprovalStats } from '@/lib/approvals';

export async function GET() {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get parent's families
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, name')
      .eq('created_by', user.id);

    if (familiesError) {
      return NextResponse.json({ error: 'Failed to fetch families' }, { status: 500 });
    }

    if (!families || families.length === 0) {
      return NextResponse.json({ pending: [], stats: {} });
    }

    // Get pending children for all families
    const pending = await getPendingChildren(user.id);

    // Get stats for each family
    const statsPromises = (families as Array<{ id: string; name: string }>).map(async (family) => {
      const stats = await getApprovalStats(family.id);
      return {
        familyId: family.id,
        familyName: family.name,
        stats,
      };
    });

    const stats = await Promise.all(statsPromises);

    return NextResponse.json({
      pending,
      stats,
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
