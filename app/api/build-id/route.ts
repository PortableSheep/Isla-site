import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Returns the current deployment's build identifier so clients (especially
// installed PWAs that aggressively cache HTML) can detect a new deploy and
// reload themselves. Falls back to 'dev' for local development.
export async function GET() {
  const id =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_BUILD_ID ||
    'dev';
  return NextResponse.json(
    { id },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    },
  );
}
