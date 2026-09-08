import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../types';
import { fetchAPI } from '../lib/api';
import { useAuth } from './AuthContext';

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addNotification: (item: { title: string; message: string; type?: 'info' | 'warning' | 'success' | 'error' }) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1 min ago';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 7200) return '1 hour ago';
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 172800) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }
    try {
      const data = await fetchAPI('/api/notifications');
      const rawList = Array.isArray(data) ? data : (data?.items || []);
      const mapped: NotificationItem[] = rawList.map((n: any) => ({
        id: n.id,
        title: n.title || 'System Notification',
        desc: n.desc || n.message || '',
        message: n.message || n.desc || '',
        time: formatRelativeTime(n.created_at),
        created_at: n.created_at,
        type: (n.type as any) || 'info',
        category: (n.category as any) || 'system',
        read: Boolean(n.is_read || n.read),
        is_read: Boolean(n.is_read || n.read),
        user_id: n.user_id,
        organization_id: n.organization_id,
      }));
      setNotifications(mapped);
    } catch (err) {
      console.warn('Notification fetch warning:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    if (!isAuthenticated) return;

    // Live sync polling every 4 seconds
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isAuthenticated]);

  const markAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, is_read: true } : n))
      );
      await fetchAPI(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, is_read: true }))
      );
      await fetchAPI('/api/notifications/read-all', { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await fetchAPI(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete notification:', err);
      fetchNotifications();
    }
  };

  const clearAll = async () => {
    try {
      setNotifications([]);
      await fetchAPI('/api/notifications/clear-all', { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      fetchNotifications();
    }
  };

  const addNotification = async (item: { title: string; message: string; type?: 'info' | 'warning' | 'success' | 'error' }) => {
    try {
      await fetchAPI('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: item.title,
          message: item.message,
          type: item.type || 'info',
        }),
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read && !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
