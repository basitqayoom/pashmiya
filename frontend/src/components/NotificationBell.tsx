'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_created':
        return '📦';
      case 'order_shipped':
        return '🚚';
      case 'order_delivered':
        return '✅';
      case 'order_status':
        return '📋';
      case 'low_stock':
        return '⚠️';
      case 'product_update':
        return '🆕';
      default:
        return '🔔';
    }
  };

  if (loading) return null;

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className={styles.markAllRead}
                onClick={markAllAsRead}
              >
                <Check size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={32} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div 
                  key={notification.id}
                  className={`${styles.item} ${!notification.read_at ? styles.unread : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <span className={styles.icon}>
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className={styles.content}>
                    <p className={styles.title}>{notification.title}</p>
                    <p className={styles.message}>{notification.message}</p>
                    <span className={styles.time}>
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <button 
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <a href="/notifications" className={styles.viewAll}>
              View all notifications
            </a>
          )}
        </div>
      )}
    </div>
  );
}
