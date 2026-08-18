// Fichier: src/context/NotificationContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { apiClient } from '@/lib/apiClient';
import { usePathname } from 'next/navigation';

interface Notification {
  id: number;
  message: string;
  link: string;
  read: boolean;
  isRead?: boolean;
  createdAt: string;
  type?: string;                    // ✅ i18n : code stable pour re-rendre le texte traduit (optionnel, absent sur l'historique)
  params?: Record<string, unknown>; // ✅ i18n : données structurées pour l'interpolation
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>; // ✅ NOUVEAU
  markConversationAsRead: (bookingId: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  const refreshNotifications = useCallback(async () => {
    // 🛑 Ne pas charger les notifications sur la page de paiement
    if (pathname && pathname.startsWith('/payment')) return;

    try {
      const allNotifications: Notification[] = await apiClient.get('/api/notifications');
      const formattedNotifications = allNotifications.map(n => ({
        ...n,
        read: n.isRead ?? n.read
      }));

      setNotifications(formattedNotifications);
      const unread = formattedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('❌ Failed to refresh notifications:', error);
    }
  }, [pathname]);

  useEffect(() => {
    if (isLoading) return;

    if (!user || !user.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // 🛑 LE COUPE-CIRCUIT : Ne pas essayer de charger les notifications ou le WebSocket si on est sur la page de paiement
    if (pathname && pathname.startsWith('/payment')) {
      console.log('🛑 Sur la page de paiement : WebSockets et Notifications en pause.');
      return;
    }

    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    const fetchInitialNotifications = async () => {
      try {
        const allNotifications: Notification[] = await apiClient.get('/api/notifications');
        const formattedNotifications = allNotifications.map(n => ({
          ...n,
          read: n.isRead ?? n.read
        }));

        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('❌ Failed to fetch initial notifications:', error);
      }
    };

    fetchInitialNotifications();

    const userId = user.id;
    const client = new Client({
      webSocketFactory: () => new SockJS('http://127.0.0.1:8081/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        client.subscribe(`/topic/notifications/${userId}`, (message) => {
          try {
            const newNotification: Notification = JSON.parse(message.body);
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          } catch (error) {
            console.error('❌ Error parsing notification:', error);
          }
        });
      },
      onStompError: (frame) => console.error('❌ STOMP error for user ID:', userId, frame),
      onWebSocketError: (error) => console.error('❌ WebSocket error for user ID:', userId, error),
    });

    try {
      client.activate();
    } catch (error) {
      console.error('❌ Failed to activate WebSocket:', error);
    }

    return () => {
      client.deactivate();
    };
  }, [user, isLoading, pathname]);

  /**
   * Marque une notification spécifique comme lue
   */
  const markAsRead = useCallback(async (id: number) => {
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;

    try {
      // 🚀 Mise à jour optimiste (instantanée côté frontend)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // 📡 Synchronisation avec le backend
      await apiClient.put(`/api/notifications/${id}/read`, {});
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      // 🔄 Rollback en cas d'erreur
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  }, [notifications, unreadCount]);

  /**
   * ✅ NOUVEAU : Marque TOUTES les notifications comme lues en un seul appel
   */
  const markAllAsRead = useCallback(async () => {
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;

    try {
      // 🚀 Mise à jour optimiste
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      // 📡 Synchronisation avec le backend
      await apiClient.put('/api/notifications/read-all', {});
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      // 🔄 Rollback en cas d'erreur
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  }, [notifications, unreadCount]);

  /**
   * ✅ Marque comme lues toutes les notifications NEW_CHAT_MESSAGE d'une conversation (réservation)
   * donnée. Appelé quand l'utilisateur ouvre/consulte ce chat — n'affecte jamais les notifications
   * d'autres types (incident, statut...) ni d'autres conversations, même sur la même réservation.
   */
  const markConversationAsRead = useCallback(async (bookingId: number) => {
    const matchingIds = notifications
      .filter(n => !n.read && n.type === 'NEW_CHAT_MESSAGE' && Number(n.params?.bookingId) === bookingId)
      .map(n => n.id);

    if (matchingIds.length === 0) return; // Rien à faire, aucun appel réseau

    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;

    try {
      // 🚀 Mise à jour optimiste
      setNotifications(prev => prev.map(n => matchingIds.includes(n.id) ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - matchingIds.length));

      // 📡 Synchronisation avec le backend
      await apiClient.put(`/api/notifications/conversation/${bookingId}/read`, {});
    } catch (error) {
      console.error('❌ Failed to mark conversation notifications as read:', error);
      // 🔄 Rollback en cas d'erreur
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  }, [notifications, unreadCount]);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead, // ✅ NOUVEAU
    markConversationAsRead,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};