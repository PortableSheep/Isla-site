'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types/notifications';
import { Bell, Trash2, CheckCheck, Filter, X } from 'lucide-react';
import { CreatureDisplay } from '@/components/CreatureDisplay';
import styles from '@/styles/hand-drawn.module.css';

const NOTIFICATION_TYPES = [
  { value: 'update', label: '📢 Updates' },
  { value: 'reply', label: '💬 Replies' },
  { value: 'child_approved', label: '✅ Child Approved' },
  { value: 'child_rejected', label: '❌ Child Rejected' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      let url = '/api/notifications?limit=100&offset=0';
      if (selectedType) {
        url += `&type=${selectedType}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedType]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(notifications.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) {
      return;
    }

    try {
      // Delete all notifications individually
      await Promise.all(
        notifications.map((n) =>
          fetch(`/api/notifications/${n.id}/delete`, { method: 'DELETE' })
        )
      );
      setNotifications([]);
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  };

  const filteredNotifications = unreadOnly ? notifications.filter((n) => !n.read) : notifications;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'update':
        return '📢';
      case 'reply':
        return '💬';
      case 'child_approved':
        return '✅';
      case 'child_rejected':
        return '❌';
      default:
        return '🔔';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-white dark:from-gray-950 dark:via-orange-950 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with Zing creature */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="hidden sm:block">
              <CreatureDisplay
                creatureId="zing"
                state="alert"
                animation="pulse"
                size="medium"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-3">
                Your Notifications
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {filteredNotifications.length} {filteredNotifications.length === 1 ? 'notification' : 'notifications'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete all
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Filter by type:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedType === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {NOTIFICATION_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedType === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="unreadOnly"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="unreadOnly" className="text-gray-700 dark:text-gray-300">
              Unread only
            </label>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-3"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div
              className={`${styles.emptyStateContainer} bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30`}
            >
              <div className={styles.emptyStateCreature}>
                <CreatureDisplay
                  creatureId="cozy"
                  state="stretching"
                  size="large"
                />
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                You&apos;ll see updates, replies, and approvals here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all ${
                  !notification.read
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-amber-500 rounded-full ml-auto"></div>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatTime(new Date(notification.created_at))}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Click to navigate link */}
                <button
                  onClick={() => router.push(notification.link)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-3 inline-block"
                >
                  View →
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}
