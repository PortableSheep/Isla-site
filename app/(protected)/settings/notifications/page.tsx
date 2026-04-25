import { createClient } from '@/lib/supabaseServer';
import { getUserPreferences } from '@/lib/notificationPrefs';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NotificationSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const preferences = await getUserPreferences(user.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage how and when you receive notifications.
        </p>
      </div>
      <NotificationPreferences preferences={preferences} />
    </div>
  );
}
