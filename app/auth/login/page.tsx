'use client';

import { AuthForm } from '@/components/AuthForm';
import { CreatureDisplay } from '@/components/CreatureDisplay';
import styles from '@/styles/hand-drawn.module.css';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-950 dark:via-purple-950 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Glimmer Guide Creature - hidden on mobile */}
        <div className="hidden md:flex absolute top-12 right-12 md:right-8 lg:right-12">
          <CreatureDisplay
            creatureId="glimmer"
            state="happy"
            animation="wave"
            size="medium"
          />
        </div>

        {/* Header with Glimmer on desktop */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <CreatureDisplay
              creatureId="glimmer"
              state="greeting"
              size="small"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to connect with your family on Isla Zone
          </p>
        </div>

        {/* Login form container with hand-drawn border */}
        <div
          className={`${styles.handDrawnBorder} bg-white dark:bg-gray-900 p-8 relative`}
          style={{
            borderColor: '#A855F7',
            '--creature-color': '#A855F7',
          } as React.CSSProperties}
        >
          {/* Creature corner decorations */}
          <div
            className={`${styles.creatureCornerTL} hidden sm:block`}
            style={{ '--creature-color': '#EC4899' } as React.CSSProperties}
          />
          <div
            className={`${styles.creatureCornerTR} hidden sm:block`}
            style={{ '--creature-color': '#A78BFA' } as React.CSSProperties}
          />

          {/* Auth Form */}
          <AuthForm type="login" />

          {/* Footer links */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <a
              href="/auth/reset-password"
              className="text-sm font-medium text-purple-600 hover:text-pink-600 dark:text-purple-400 dark:hover:text-pink-400 transition-colors"
            >
              Forgot password?
            </a>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Don&apos;t have an account?{' '}
              <a
                href="/auth/signup"
                className="font-semibold text-purple-600 hover:text-pink-600 dark:text-purple-400 dark:hover:text-pink-400 transition-colors"
              >
                Create one
              </a>
            </p>
          </div>
        </div>

        {/* Help text with Wave creature */}
        <div className="mt-8 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="hidden sm:block">
            <CreatureDisplay creatureId="wave" state="smiling" size="small" />
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Your account and family information are safe with us!
          </p>
        </div>
      </div>
    </div>
  );
}
