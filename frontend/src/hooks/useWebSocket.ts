'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';

interface WebSocketMessage {
  type: string;
  id?: number;
  title?: string;
  message?: string;
  channel?: string;
  notif_type?: string;
  created_at?: string;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { refresh } = useNotifications();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const connect = useCallback((userId?: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const url = userId ? `${WS_URL}?user_id=${userId}` : WS_URL;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      if (userId) {
        ws.send(JSON.stringify({ type: 'auth', user_id: userId }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const messages = event.data.split('\n');
        messages.forEach((msg: string) => {
          if (!msg.trim()) return;
          const data: WebSocketMessage = JSON.parse(msg);
          setLastMessage(data);

          if (data.type === 'notification') {
            refresh();
            
            if (Notification.permission === 'granted') {
              new Notification(data.title || 'New Notification', {
                body: data.message,
                icon: '/favicon.ico',
              });
            }
          }
        });
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;
      
      setTimeout(() => {
        connect(userId);
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [refresh]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
  };
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted' && vapidPublicKey && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        setSubscription(sub as unknown as PushSubscription);

        await fetch('/api/notifications/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            p256dh: sub.toJSON().keys?.p256dh,
            auth: sub.toJSON().keys?.auth,
          }),
        });
      }

      return result === 'granted';
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      return false;
    }
  }, [isSupported, vapidPublicKey]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, options);
    }
  }, [permission]);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    showNotification,
  };
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
