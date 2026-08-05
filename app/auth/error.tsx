'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { CreatureDisplay } from '@/components/CreatureDisplay';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[auth] page failed', error);
  }, [error]);

  return (
    <div className="w-full text-center">
      <div className="iz-card space-y-5 p-8">
        <div className="flex justify-center">
          <CreatureDisplay creatureId="wave" state="sad" size="medium" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">That page hit a snag</h1>
          <p className="mt-2 text-sm text-slate-400">
            Your wall name is still safe. Try loading the account page again.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="iz-btn-primary rounded-xl px-5 py-3">
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:text-white"
          >
            Back to the wall
          </Link>
        </div>
      </div>
    </div>
  );
}
