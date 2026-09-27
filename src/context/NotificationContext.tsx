import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { NotificationItem } from '../types';
import { fetchAPI } from '../lib/api';
import { useAuth } from './AuthContext';

export interface BroadcastPayload {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  category?: 'telephony' | 'calls' | 'system' | 'billing' | 'security';
  target_type?: 'all' | 'user' | 'role' | 'organization';
  target_id?: string;
}

export type FeedScope = 'workspace' | 'global_admin' | 'broadcasts';

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  feedScope: FeedScope;
  setFeedScope: (scope: FeedScope) => void;
  categoryCounts: {
    all: number;
    calls: number;
    telephony: number;
    system: number;
    billing: number;
    security: number;
  };
  fetchNotifications: (scopeOverride?: FeedScope) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addNotification: (item: { title: string; message: string; type?: 'info' | 'warning' | 'success' | 'error'; category?: string }) => Promise<void>;
  broadcastNotification: (payload: BroadcastPayload) => Promise<{ success: boolean; message: string; count?: number }>;
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
  const [feedScope, setFeedScope] = useState<FeedScope>('workspace');
  const { isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async (scopeOverride?: FeedScope) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }
    const activeScope = scopeOverride || feedScope;
    try {
      const data = await fetchAPI(`/api/notifications?feed_scope=${activeScope}`);
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
        sender_role: n.sender_role,
        is_super_admin: Boolean(n.is_super_admin || n.sender_role === 'super_admin' || n.is_broadcast),
        is_broadcast: Boolean(n.is_broadcast),
        read: Boolean(n.is_read || n.read),
        is_read: Boolean(n.is_read || n.read),
        actionLabel: n.actionLabel || n.action_label,
        actionUrl: n.actionUrl || n.action_url,
        user_id: n.user_id,
        user_email: n.user_email,
        organization_id: n.organization_id,
        organization_name: n.organization_name,
      }));
      setNotifications(mapped);
    } catch (err) {
      console.warn('Notification fetch warning:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, feedScope]);

  useEffect(() => {
    fetchNotifications();
    if (!isAuthenticated) return;

    // Live sync polling every 4 seconds
    const interval = setInterval(() => fetchNotifications(), 4000);
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

  const addNotification = async (item: { title: string; message: string; type?: 'info' | 'warning' | 'success' | 'error'; category?: string }) => {
    try {
      await fetchAPI('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: item.title,
          message: item.message,
          type: item.type || 'info',
        }),
      });
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  };

  const broadcastNotification = async (payload: BroadcastPayload) => {
    try {
      const res = await fetchAPI('/api/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await fetchNotifications();
      return {
        success: true,
        message: res?.message || 'Notification broadcasted successfully.',
        count: res?.count,
      };
    } catch (err: any) {
      console.error('Broadcast notification error:', err);
      throw err;
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read && !n.is_read).length;
  }, [notifications]);

  const categoryCounts = useMemo(() => {
    const counts = {
      all: notifications.length,
      calls: 0,
      telephony: 0,
      system: 0,
      billing: 0,
      security: 0,
    };
    notifications.forEach((n) => {
      const cat = n.category || 'system';
      if (cat in counts) {
        counts[cat as keyof typeof counts]++;
      }
    });
    return counts;
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        feedScope,
        setFeedScope,
        categoryCounts,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        broadcastNotification,
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
