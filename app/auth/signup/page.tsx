'use client';

import { useState } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { CreatureDisplay } from '@/components/CreatureDisplay';
import styles from '@/styles/hand-drawn.module.css';

export default function SignUpPage() {
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSignupSuccess = () => {
    setSignupSuccess(true);
    setTimeout(() => setSignupSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-white dark:from-gray-950 dark:via-orange-950 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Wave creature greeting */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <CreatureDisplay
              creatureId="wave"
              state="waving"
              animation="wave"
              size="medium"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Join Isla Zone
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create an account to share family moments
          </p>
        </div>

        {/* Signup form container with hand-drawn border */}
        <div
          className={`${styles.handDrawnBorder} bg-white dark:bg-gray-900 p-8 relative`}
          style={{
            borderColor: '#FB923C',
            '--creature-color': '#FB923C',
          } as React.CSSProperties}
        >
          {/* Creature corner decorations */}
          <div
            className={`${styles.creatureCornerTL} hidden sm:block`}
            style={{ '--creature-color': '#EC4899' } as React.CSSProperties}
          />
          <div
            className={`${styles.creatureCornerBR} hidden sm:block`}
            style={{ '--creature-color': '#FBBF24' } as React.CSSProperties}
          />

          <AuthForm type="signup" onSuccess={handleSignupSuccess} />

          {/* Progress indicator with creature states */}
          <div className="mt-8 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center text-lg">😊</div>
              <span>Account</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center text-lg">🤔</div>
              <span>Profile</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center text-lg">🎉</div>
              <span>Done!</span>
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <a
                href="/auth/login"
                className="font-semibold text-orange-600 hover:text-pink-600 dark:text-orange-400 dark:hover:text-pink-400 transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>

        {/* Success celebration with Cheery */}
        {signupSuccess && (
          <div
            className={`${styles.celebrationAnimation} mt-6 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800`}
          >
            <div>
              <CreatureDisplay
                creatureId="cheery"
                state="celebrating"
                animation="celebrate"
                size="small"
              />
            </div>
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Welcome to Isla Zone! Check your email to verify.
            </p>
          </div>
        )}

        {/* Info message with Glimmer */}
        <div className="mt-6 flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="hidden sm:block">
            <CreatureDisplay
              creatureId="glimmer"
              state="thinking"
              size="small"
            />
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            A parent will need to approve your profile before you can access the family wall.
          </p>
        </div>
      </div>
    </div>
  );
}
