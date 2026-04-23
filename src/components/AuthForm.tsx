'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn, validateEmail, validatePassword } from '@/lib/auth';
import { announceToScreenReader } from '@/lib/accessibility';

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
        await signIn(email, password);
        const msg = 'Logged in successfully!';
        setSuccess(msg);
        announceToScreenReader(msg, 'polite');
        setTimeout(() => {
          onSuccess?.();
          router.push('/dashboard');
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
      className="w-full max-w-md mx-auto"
      aria-label={`${type === 'signup' ? 'Sign up' : 'Sign in'} form`}
    >
      <div className="space-y-4">
        {error && (
          <div 
            id={errorId}
            className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div 
            id={successId}
            className="bg-green-900/20 border border-green-700 text-green-200 px-4 py-3 rounded-lg text-sm"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {success}
          </div>
        )}

        <div>
          <label 
            htmlFor={emailId}
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Email <span aria-label="required">*</span>
          </label>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
            required
            aria-required="true"
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        <div>
          <label 
            htmlFor={passwordId}
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Password <span aria-label="required">*</span>
          </label>
          <input
            id={passwordId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
            required
            aria-required="true"
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        {type === 'signup' && (
          <div>
            <label 
              htmlFor={confirmPasswordId}
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Confirm Password <span aria-label="required">*</span>
            </label>
            <input
              id={confirmPasswordId}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-busy={loading}
        >
          {loading ? 'Loading...' : type === 'signup' ? 'Create Account' : 'Sign In'}
        </button>

        <p className="text-center text-sm text-gray-400">
          {type === 'signup' ? (
            <>
              Already have an account?{' '}
              <a 
                href="/auth/login" 
                className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
              >
                Sign in
              </a>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <a 
                href="/auth/signup" 
                className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
              >
                Create one
              </a>
            </>
          )}
        </p>

        {type === 'login' && (
          <p className="text-center text-sm">
            <a
              href="/auth/reset-password"
              className="text-blue-400 hover:text-blue-300"
            >
              Forgot password?
            </a>
          </p>
        )}
      </div>
    </form>
  );
}
