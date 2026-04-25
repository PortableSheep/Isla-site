import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Isla Zone — Upgrading',
  description: 'The zone is temporarily closed for upgrades.',
};

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="text-7xl" role="img" aria-label="Construction">
          🦖
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-fuchsia-300">
          The zone is closed for upgrades!
        </h1>
        <p className="text-lg text-slate-300">
          Check back in a bit!
        </p>
        <p className="text-sm text-slate-500">
          We&apos;re making Isla Zone even better. It won&apos;t be long.
        </p>
      </div>
    </div>
  );
}
