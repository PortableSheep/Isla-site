'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateFamilyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please enter a family name');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/families/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to create family');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen iz-grid-bg flex items-center justify-center px-4 py-12">
      <div className="iz-card w-full max-w-md p-8">
        <h1 className="text-3xl font-bold iz-gradient-text mb-2">
          Create a family
        </h1>
        <p className="text-slate-400 mb-6 text-sm">
          You&apos;ll be the admin and can invite other members.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-slate-300 mb-2">
              Family name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Smiths"
              maxLength={255}
              autoFocus
              disabled={submitting}
              className="iz-input"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-300" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Link href="/dashboard" className="iz-btn-ghost flex-1 text-center py-2">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="iz-btn-primary flex-1 py-2"
            >
              {submitting ? 'Creating…' : 'Create family'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
