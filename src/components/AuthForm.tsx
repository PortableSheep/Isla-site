'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn, validateEmail, validatePassword } from '@/lib/auth';
import { announceToScreenReader } from '@/lib/accessibility';
import { supabase } from '@/lib/supabase';

interface AuthFormProps {
  type: 'signup' | 'login';
  onSuccess?: () => void;
}

export function AuthForm({ type, onSuccess }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (!email || !password) {
        const msg = 'Email and password are required';
        setError(msg);
        announceToScreenReader(msg, 'assertive');
        return;
      }

      const isValidEmail = await validateEmail(email);
      if (!isValidEmail) {
        const msg = 'Please enter a valid email address';
        setError(msg);
        announceToScreenReader(msg, 'assertive');
        return;
      }

      const passwordError = await validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        announceToScreenReader(passwordError, 'assertive');
        return;
      }

      if (type === 'signup') {
        if (password !== confirmPassword) {
          const msg = 'Passwords do not match';
          setError(msg);
          announceToScreenReader(msg, 'assertive');
          return;
        }
        setLoading(true);
        await signUp(email, password);
        const msg = 'Account created! Please check your email to confirm your account.';
        setSuccess(msg);
        announceToScreenReader(msg, 'polite');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setLoading(true);
        const { user } = await signIn(email, password);
        const msg = 'Logged in successfully!';
        setSuccess(msg);
        announceToScreenReader(msg, 'polite');
        // Admins land on the moderation dashboard; everyone else (Isla) on
        // the wall. Best-effort: if the admin check fails we still route to /.
        let destination = '/';
        if (user?.id) {
          try {
            const { data } = await supabase.rpc('is_admin', { uid: user.id });
            if (data === true) destination = '/admin/moderation';
          } catch (err) {
            console.error('[auth] is_admin check failed', err);
          }
        }
        setTimeout(() => {
          onSuccess?.();
          router.push(destination);
        }, 1000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      announceToScreenReader(message, 'assertive');
    } finally {
      setLoading(false);
    }
  };

  const emailId = 'auth-email';
  const passwordId = 'auth-password';
  const confirmPasswordId = 'auth-confirm-password';
  const errorId = 'auth-error';
  const successId = 'auth-success';

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
      aria-label={`${type === 'signup' ? 'Sign up' : 'Sign in'} form`}
    >
      <div className="space-y-5">
        {error && (
          <div
            id={errorId}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <strong className="font-semibold">Error:</strong> {error}
          </div>
        )}
        {success && (
          <div
            id={successId}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {success}
          </div>
        )}

        <div>
          <label htmlFor={emailId} className="block text-sm font-medium text-slate-200 mb-2">
            Email <span className="text-fuchsia-300" aria-label="required">*</span>
          </label>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="iz-input"
            disabled={loading}
            required
            aria-required="true"
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        <div>
          <label htmlFor={passwordId} className="block text-sm font-medium text-slate-200 mb-2">
            Password <span className="text-fuchsia-300" aria-label="required">*</span>
          </label>
          <input
            id={passwordId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="iz-input"
            disabled={loading}
            required
            aria-required="true"
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        {type === 'signup' && (
          <div>
            <label htmlFor={confirmPasswordId} className="block text-sm font-medium text-slate-200 mb-2">
              Confirm Password <span className="text-fuchsia-300" aria-label="required">*</span>
            </label>
            <input
              id={confirmPasswordId}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="iz-input"
              disabled={loading}
              required
              aria-required="true"
              aria-describedby={error ? errorId : undefined}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="iz-btn-primary w-full h-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          aria-busy={loading}
        >
          {loading ? 'Please wait…' : type === 'signup' ? 'Create Account' : 'Sign In'}
        </button>

        {type === 'login' && (
          <p className="text-center text-sm">
            <a
              href="/auth/reset-password"
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              Forgot password?
            </a>
          </p>
        )}
      </div>
    </form>
  );
}
