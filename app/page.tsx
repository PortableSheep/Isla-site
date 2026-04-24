import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative flex flex-col flex-1 overflow-hidden">
      {/* Decorative grid overlay */}
      <div aria-hidden className="pointer-events-none absolute inset-0 iz-grid-bg opacity-40" />

      {/* Floating creature decorations — hidden on small screens */}
      <div aria-hidden className="pointer-events-none absolute -top-6 -left-6 w-40 h-40 rounded-full bg-purple-500/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 -right-10 w-64 h-64 rounded-full bg-pink-500/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />

      <section className="relative flex flex-1 w-full mx-auto max-w-5xl flex-col items-center justify-center py-24 md:py-32 px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          A private space for your family
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
          Welcome to{' '}
          <span className="iz-gradient-text">Isla Zone</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300/90 max-w-2xl mb-12 leading-relaxed">
          A warm, private message wall where families share thoughts, memories, and
          everyday little moments — safely, and together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link
            href="/auth/signup"
            className="iz-btn-primary flex h-12 flex-1 items-center justify-center rounded-xl px-6"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="iz-btn-ghost flex h-12 flex-1 items-center justify-center rounded-xl px-6"
          >
            Sign In
          </Link>
        </div>

        <p className="text-sm text-slate-500 mt-14">
          Built with Next.js, TypeScript, and Supabase
        </p>
      </section>
    </div>
  );
}

