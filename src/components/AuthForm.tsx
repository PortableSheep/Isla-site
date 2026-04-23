'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn, validateEmail, validatePassword } from '@/lib/auth';

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
        setError('Email and password are required');
        return;
      }

      const isValidEmail = await validateEmail(email);
      if (!isValidEmail) {
        setError('Please enter a valid email address');
        return;
      }

      const passwordError = await validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (type === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        setLoading(true);
        await signUp(email, password);
        setSuccess('Account created! Please check your email to confirm your account.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setLoading(true);
        await signIn(email, password);
        setSuccess('Logged in successfully!');
        setTimeout(() => {
          onSuccess?.();
          router.push('/dashboard');
        }, 1000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/20 border border-green-700 text-green-200 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
        </div>

        {type === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Loading...' : type === 'signup' ? 'Create Account' : 'Sign In'}
        </button>

        <p className="text-center text-sm text-gray-400">
          {type === 'signup' ? (
            <>
              Already have an account?{' '}
              <a href="/auth/login" className="text-blue-400 hover:text-blue-300">
                Sign in
              </a>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <a href="/auth/signup" className="text-blue-400 hover:text-blue-300">
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
