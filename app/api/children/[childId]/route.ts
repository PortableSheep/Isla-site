import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getChildProfile, updateChildProfile, deleteChildProfile } from '@/lib/childProfiles';
import { UpdateChildProfileRequest } from '@/types/child';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childId } = await params;
    const profile = await getChildProfile(childId);

    if (profile.parent_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error('Error fetching child profile:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch child profile';

    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childId } = await params;
    const profile = await getChildProfile(childId);

    if (profile.parent_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow updates if profile is pending approval
    if (profile.status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'Can only edit profiles with pending_approval status' },
        { status: 400 }
      );
    }

    const body: UpdateChildProfileRequest = await request.json();
    const updated = await updateChildProfile(childId, body);

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating child profile:', error);
    const message = error instanceof Error ? error.message : 'Failed to update child profile';

    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childId } = await params;

    await deleteChildProfile(childId, user.id);

    return NextResponse.json({ message: 'Child profile deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting child profile:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete child profile';

    if (message.includes('not found') || message.includes('does not belong')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message.includes('pending_approval')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
