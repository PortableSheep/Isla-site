import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Returns the VAPID public key. Used by the service worker (which has no
 * access to NEXT_PUBLIC_* build-time env vars) to recover a subscription on
 * `pushsubscriptionchange`. The key is public by design; safe to expose.
 */
export async function GET() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
  return NextResponse.json({ key });
}
