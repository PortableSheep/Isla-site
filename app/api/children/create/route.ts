import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createChildProfile } from '@/lib/childProfiles';
import { CreateChildProfileRequest } from '@/types/child';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateChildProfileRequest = await request.json();

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Child name is required' }, { status: 400 });
    }

    const profile = await createChildProfile(user.id, body);

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Error creating child profile:', error);
    const message = error instanceof Error ? error.message : 'Failed to create child profile';

    if (message.includes('duplicate') || message.includes('already exists')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
