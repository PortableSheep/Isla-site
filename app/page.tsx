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

      <footer className="relative mt-auto border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <Link href="/auth/login" className="hover:text-slate-300">
          Isla &amp; admin sign in
        </Link>
      </footer>
    </div>
  );
}

