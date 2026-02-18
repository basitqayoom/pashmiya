'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/api';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const userId = parseInt(localStorage.getItem('user_id') || '0', 10);
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
          const data = JSON.parse(msg);
          
          if (data.type === 'notification') {
            setNotifications(prev => [{
              id: data.id,
              type: data.notif_type || 'notification',
              channel: data.channel || 'in_app',
              title: data.title,
              message: data.message,
              status: 'sent',
              created_at: data.created_at || new Date().toISOString(),
            } as Notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            if (Notification.permission === 'granted') {
              new Notification(data.title, {
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
      
      reconnectTimeoutRef.current = setTimeout(() => {
        const newToken = localStorage.getItem('token');
        if (newToken) {
          connectWebSocket();
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    fetchNotifications();
    
    const token = localStorage.getItem('token');
    if (token) {
      connectWebSocket();
      
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const markAsRead = async (id: number) => {
    await api.markAsRead(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await api.markAllAsRead();
    setNotifications(prev => 
      prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = async (id: number) => {
    const notification = notifications.find(n => n.id === id);
    await api.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (!notification?.read_at) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const refresh = async () => {
    await fetchNotifications();
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refresh,
      isConnected
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
