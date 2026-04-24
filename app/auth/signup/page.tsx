'use client';

import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { CreatureDisplay } from '@/components/CreatureDisplay';

export default function SignUpPage() {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <CreatureDisplay creatureId="wave" state="happy" size="medium" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight iz-gradient-text">
          Join Isla Zone
        </h1>
        <p className="mt-3 text-slate-400">
          Create an account to share family moments
        </p>
      </div>

      <div className="iz-card p-8">
        <AuthForm type="signup" />
      </div>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-fuchsia-300 hover:text-fuchsia-200 font-medium transition-colors">
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-slate-500">
        A parent will need to approve your profile before you access the family wall.
      </p>
    </div>
  );
}
