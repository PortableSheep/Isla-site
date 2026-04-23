import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getApprovalHistory } from '@/lib/approvals';

export async function GET(request: Request) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const action = searchParams.get('action') as 'approved' | 'rejected' | null;

    if (!familyId) {
      return NextResponse.json({ error: 'familyId is required' }, { status: 400 });
    }

    // Verify user has access to this family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id')
      .eq('id', familyId)
      .eq('created_by', user.id)
      .single();

    if (familyError || !family) {
      return NextResponse.json(
        { error: 'You do not have access to this family' },
        { status: 403 }
      );
    }

    const history = await getApprovalHistory(familyId, action || undefined);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching approval history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
