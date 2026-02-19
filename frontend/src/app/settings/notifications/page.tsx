'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Bell, Mail, MessageSquare, Smartphone, Save, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

interface NotificationPreferences {
  order_created: boolean;
  order_shipped: boolean;
  order_delivered: boolean;
  order_status: boolean;
  low_stock: boolean;
  product_updates: boolean;
  newsletter: boolean;
  marketing: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    api.getNotificationPreferences()
      .then(setPreferences)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!preferences) return;
    setSaving(true);
    try {
      await api.updateNotificationPreferences(preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const enablePushNotifications = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in your browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Please enable notifications in your browser settings');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        alert('Push notifications not configured');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subJson = subscription.toJSON();
      await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        }),
      });

      setPushEnabled(true);
      alert('Push notifications enabled!');
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      alert('Failed to enable push notifications');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!preferences) {
    return <div className="min-h-screen p-8">Failed to load preferences</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft size={20} />
          Back to Shop
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Notification Preferences</h1>
              <p className="text-gray-500">Manage how you receive notifications</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Notification Channels
              </h2>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                {!pushEnabled && (
                  <button
                    onClick={enablePushNotifications}
                    className="w-full py-2 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Enable Push Notifications
                  </button>
                )}
                {pushEnabled && (
                  <div className="flex items-center gap-2 text-green-600 py-2">
                    <Check className="w-4 h-4" />
                    Push Notifications Enabled
                  </div>
                )}
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    Email Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.email_enabled}
                    onChange={(e) => setPreferences({ ...preferences, email_enabled: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    SMS Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.sms_enabled}
                    onChange={(e) => setPreferences({ ...preferences, sms_enabled: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gray-500" />
                    Push Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.push_enabled}
                    onChange={(e) => setPreferences({ ...preferences, push_enabled: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                </label>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-3">Order Notifications</h2>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Order Confirmation</span>
                  <input
                    type="checkbox"
                    checked={preferences.order_created}
                    onChange={(e) => setPreferences({ ...preferences, order_created: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Order Shipped</span>
                  <input
                    type="checkbox"
                    checked={preferences.order_shipped}
                    onChange={(e) => setPreferences({ ...preferences, order_shipped: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Order Delivered</span>
                  <input
                    type="checkbox"
                    checked={preferences.order_delivered}
                    onChange={(e) => setPreferences({ ...preferences, order_delivered: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Order Status Updates</span>
                  <input
                    type="checkbox"
                    checked={preferences.order_status}
                    onChange={(e) => setPreferences({ ...preferences, order_status: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                </label>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-3">Other Notifications</h2>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Low Stock Alerts (For wishlist items)</span>
                  <input
                    type="checkbox"
                    checked={preferences.low_stock}
                    onChange={(e) => setPreferences({ ...preferences, low_stock: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Product Updates</span>
                  <input
                    type="checkbox"
                    checked={preferences.product_updates}
                    onChange={(e) => setPreferences({ ...preferences, product_updates: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Newsletter</span>
                  <input
                    type="checkbox"
                    checked={preferences.newsletter}
                    onChange={(e) => setPreferences({ ...preferences, newsletter: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Marketing & Promotions</span>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>

            {saved && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-center">
                Preferences saved successfully!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
