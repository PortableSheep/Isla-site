import { AuthGuard } from '@/components/AuthGuard';
import { Navigation } from '@/components/Navigation';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
    </AuthGuard>
  );
}
