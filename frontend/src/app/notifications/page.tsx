'use client';

import { useState, useEffect } from 'react';
import { api, Notification } from '@/lib/api';
import { Bell, Check, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useNotifications } from '@/context/NotificationContext';

export default function NotificationsPage() {
  const { notifications, unreadCount, refresh, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read_at)
    : notifications;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_created': return '📦';
      case 'order_shipped': return '🚚';
      case 'order_delivered': return '✅';
      case 'order_status': return '📋';
      case 'low_stock': return '⚠️';
      case 'product_update': return '🆕';
      default: return '🔔';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft size={20} />
          Back to Shop
        </Link>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Notifications</h1>
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg"
              >
                <Check size={16} />
                Mark all read
              </button>
            )}
          </div>

          <div className="p-4 border-b">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm ${
                  filter === 'all' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm ${
                  filter === 'unread' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    !notification.read_at ? 'bg-amber-50/50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-medium ${!notification.read_at ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">
                          {notification.channel}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/settings/notifications" 
            className="text-amber-600 hover:text-amber-700 text-sm"
          >
            Manage notification preferences →
          </Link>
        </div>
      </div>
    </div>
  );
}
