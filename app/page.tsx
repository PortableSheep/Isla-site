import Link from 'next/link';
import { PublicWall } from '@/components/wall/PublicWall';

export default function Home() {
  return (
    <div className="relative flex flex-col flex-1 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 iz-grid-bg opacity-30" />
      <div aria-hidden className="pointer-events-none absolute -top-6 -left-6 w-40 h-40 rounded-full bg-purple-500/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 -right-10 w-64 h-64 rounded-full bg-pink-500/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />

      <PublicWall />

      <Link
        href="/auth/login"
        aria-label="Sign in (Isla &amp; admins)"
        title="Sign in"
        className="fixed top-3 right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-900/60 text-slate-500 backdrop-blur-md transition hover:border-fuchsia-400/40 hover:bg-slate-900/80 hover:text-fuchsia-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M15.5 7.5a3.5 3.5 0 1 1-3.39 4.39L8 16l-2 0 0 2-2 0 0 2-2 0 0-2.59a1 1 0 0 1 .29-.7L9.11 11.1A3.5 3.5 0 1 1 15.5 7.5Z" />
          <circle cx="16" cy="8" r="0.9" fill="currentColor" />
        </svg>
      </Link>

      <footer className="relative mt-auto border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <Link href="/auth/login" className="hover:text-slate-300">
          Isla &amp; admin sign in
        </Link>
      </footer>
    </div>
  );
}

