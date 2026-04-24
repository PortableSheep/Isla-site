'use client';

import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Family = {
  id: string;
  name: string;
  memberCount: number;
};

type Profile = {
  family_id: string | null;
  role: 'isla' | 'admin' | 'parent' | 'child' | null;
  status: 'pending_approval' | 'approved' | 'rejected' | null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.name?.split(' ')[0] || 'Friend';
  const [families, setFamilies] = useState<Family[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [famRes, meRes] = await Promise.all([
          fetch('/api/families/my-families'),
          fetch('/api/users/me'),
        ]);

        if (famRes.ok) {
          const data = await famRes.json();
          setFamilies(data.families || []);
        } else {
          setFamilies([]);
        }

        if (meRes.ok) {
          const data = await meRes.json();
          setProfile(data.profile || null);
        }

        try {
          const n = await fetch('/api/notifications/unread-count');
          if (n.ok) {
            const d = await n.json();
            setUnreadCount(d.count ?? 0);
          }
        } catch {}

        try {
          const p = await fetch('/api/approvals/pending');
          if (p.ok) {
            const d = await p.json();
            setPendingCount(Array.isArray(d.pending) ? d.pending.length : 0);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'isla';
  const needsApproval = profile?.status === 'pending_approval';

  return (
    <div className="min-h-screen iz-grid-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold iz-gradient-text mb-2">
            {firstName}, welcome back
          </h1>
          <p className="text-slate-400">
            {loading
              ? 'Loading your world…'
              : needsApproval
                ? 'Your account is awaiting approval from an admin.'
                : `${unreadCount} new notification${unreadCount === 1 ? '' : 's'}${isAdmin ? ` • ${pendingCount} pending approval${pendingCount === 1 ? '' : 's'}` : ''}`}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link href="/updates" className="iz-btn-ghost text-center py-3">
            📰 View Updates
          </Link>
          <Link href="/notifications" className="iz-btn-ghost text-center py-3">
            🔔 Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Link>
          <Link href="/settings" className="iz-btn-ghost text-center py-3">
            ⚙️ Settings
          </Link>
        </div>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>👨‍👩‍👧‍👦</span>
              Your Families
            </h2>
            {families && families.length === 0 && !needsApproval && (
              <Link href="/create-family" className="iz-btn-primary">
                + Create Family
              </Link>
            )}
          </div>

          {loading && <p className="text-slate-500">Loading…</p>}

          {!loading && families && families.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {families.map((f) => (
                <div key={f.id} className="iz-card p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{f.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {f.memberCount} member{f.memberCount === 1 ? '' : 's'}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/wall"
                      className="iz-btn-primary flex-1 text-center"
                    >
                      View Wall
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/approvals"
                        className="iz-btn-ghost flex-1 text-center"
                      >
                        Manage
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && families && families.length === 0 && (
            <div className="iz-card p-10 text-center">
              <div className="text-5xl mb-4">🏡</div>
              <h3 className="text-xl font-bold text-white mb-2">
                No families yet
              </h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                {needsApproval
                  ? 'An admin needs to approve your account before you can join a family.'
                  : 'Create a family or accept an invite to join one.'}
              </p>
              {!needsApproval && (
                <Link href="/create-family" className="iz-btn-primary">
                  Create Family
                </Link>
              )}
            </div>
          )}
        </section>

        {isAdmin && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🛡️</span>
              Admin
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/admin/wall-moderation" className="iz-btn-primary py-3 text-center">
                🛡️ Wall moderation
              </Link>
              <Link href="/approvals" className="iz-btn-ghost py-3 text-center">
                Approvals {pendingCount > 0 && `(${pendingCount})`}
              </Link>
              <Link
                href="/approvals/history"
                className="iz-btn-ghost py-3 text-center"
              >
                Approval history
              </Link>
              {profile?.role === 'isla' && (
                <Link href="/compose" className="iz-btn-primary py-3 text-center">
                  ✨ Compose Update
                </Link>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
