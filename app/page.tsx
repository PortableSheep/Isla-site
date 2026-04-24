import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <main className="flex flex-1 w-full max-w-2xl flex-col items-center justify-center py-32 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
          Welcome to Isla Zone
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-xl">
          A private message wall designed for children to share thoughts, memories, and messages.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-sm">
          <Link
            href="/auth/login"
            className="flex h-12 w-full items-center justify-center rounded-lg bg-indigo-600 px-6 text-white font-medium transition-colors hover:bg-indigo-700"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="flex h-12 w-full items-center justify-center rounded-lg border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-medium transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            Create Account
          </Link>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-12">
          Built with Next.js, TypeScript, and Supabase
        </p>
      </main>
    </div>
  );
}
