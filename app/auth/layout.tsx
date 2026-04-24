export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-12 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-600/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}

