'use client';

import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { CreatureDisplay } from '@/components/CreatureDisplay';

export default function LoginPage() {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <CreatureDisplay creatureId="glimmer" state="happy" size="medium" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight iz-gradient-text">
          Welcome back
        </h1>
        <p className="mt-3 text-slate-400">
          Sign in to connect with your family on Isla Zone
        </p>
      </div>

      <div className="iz-card p-8">
        <AuthForm type="login" />
      </div>

      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-fuchsia-300 hover:text-fuchsia-200 font-medium transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
