// src/context/ChatContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Client, IMessage as StompMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { apiClient } from '@/lib/apiClient';

// Type pour un message (correspond au MessageDto du backend)
export interface ChatMessage {
  id: number;
  bookingId: number;
  senderId: number;
  senderFirstName: string;
  senderRole: string; // ✅ AJOUTÉ : "Propriétaire" ou "Locataire"
  vehicleBrand: string; // ✅ AJOUTÉ : Marque du véhicule (utilisée pour le header)
  recipientId: number;
  content: string;
  sentAt: string; // ISO String
  isRead: boolean;
}

interface ChatContextType {
  isOpen: boolean;
  openChat: (bookingId: number) => void;
  closeChat: () => void;
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  isLoadingMessages: boolean;
  currentBookingId: number | null;
  error: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Utilisation de useRef pour le client STOMP afin d'éviter les re-créations
  const stompClientRef = useRef<Client | null>(null);
  const isConnectingRef = useRef<boolean>(false);

  // Fonction pour établir la connexion WebSocket
  const connectWebSocket = useCallback(() => {
    if (!user || !token || stompClientRef.current?.active || isConnectingRef.current) {
        console.log("WebSocket connection skipped:", { user: !!user, token: !!token, active: stompClientRef.current?.active, connecting: isConnectingRef.current });
      return;
    }

    console.log('Attempting WebSocket connection for chat...');
    isConnectingRef.current = true;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 10000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('✅ WebSocket Connected for Chat');
        isConnectingRef.current = false;
        stompClientRef.current = client;

        client.subscribe(`/user/queue/messages`, (message: StompMessage) => {
          try {
            const newMessage: ChatMessage = JSON.parse(message.body);
            console.log('📩 Received new chat message:', newMessage);
            if (newMessage.bookingId === currentBookingId) {
              setMessages(prev => [...prev, newMessage]);
            } else {
              console.log(`Message received for another booking (${newMessage.bookingId}), not adding to current chat (${currentBookingId}).`);
            }
          } catch (parseError) {
            // ✅ CORRECTION : Renommé 'e' en 'parseError' pour éviter confusion avec 'error'
            console.error('Error parsing chat message:', parseError);
          }
        }, { id: 'chat-subscription' });

        console.log('✅ Subscribed to /user/queue/messages');
      },

      onDisconnect: () => {
        console.log('⚠️ WebSocket Disconnected for Chat');
        stompClientRef.current = null;
        isConnectingRef.current = false;
      },

      onStompError: (frame) => {
        console.error('❌ STOMP Chat Error:', frame.headers['message'], frame.body);
        setError(`Erreur WebSocket: ${frame.headers['message']}`);
        stompClientRef.current = null;
        isConnectingRef.current = false;
      },

      onWebSocketError: (wsError) => {
        // ✅ CORRECTION : Renommé 'error' en 'wsError' pour éviter shadowing
        console.error('❌ WebSocket Chat Error:', wsError);
        stompClientRef.current?.deactivate();
        stompClientRef.current = null;
        isConnectingRef.current = false;
        setError("Erreur de connexion WebSocket.");
      },

      // ✅ CORRECTION : Commenté complètement ou supprimé pour éviter 'unused variable'
      // Si vous voulez garder le debug, utilisez la variable:
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 STOMP Chat Debug:', str);
        }
      }
    });

    try {
        client.activate();
        console.log('WebSocket activation initiated...');
    } catch (activationError) {
        console.error('❌ Failed to activate WebSocket client:', activationError);
        isConnectingRef.current = false;
        setError("Impossible d'activer la connexion WebSocket.");
    }

  }, [user, token, currentBookingId]);

  useEffect(() => {
      if (user && token) {
        connectWebSocket();
      }

      return () => {
        if (stompClientRef.current?.active) {
            console.log('Deactivating WebSocket on cleanup...');
            stompClientRef.current.deactivate();
            stompClientRef.current = null;
            isConnectingRef.current = false;
        }
      };
  }, [user, token, connectWebSocket]);


  const openChat = useCallback(async (bookingId: number) => {
    if (!user) {
      setError("Vous devez être connecté pour chatter.");
      return;
    }
    setError(null);
    setMessages([]);
    setCurrentBookingId(bookingId);
    setIsOpen(true);
    setIsLoadingMessages(true);

     if (!stompClientRef.current?.active && !isConnectingRef.current) {
        console.log("WebSocket not active, attempting connection before fetching messages...");
        connectWebSocket();
     }

    try {
      console.log(`Fetching messages for booking ${bookingId}...`);
      const fetchedMessages = await apiClient.getMessages(bookingId);
      setMessages(fetchedMessages || []);
      console.log(`Fetched ${fetchedMessages?.length || 0} messages.`);
    } catch (fetchError) {
      // ✅ CORRECTION : Type explicite au lieu de 'any'
      console.error('Error fetching messages:', fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Impossible de charger les messages.';
      setError(errorMessage);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user, connectWebSocket]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setCurrentBookingId(null);
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!stompClientRef.current?.active || !currentBookingId || !content.trim()) {
      console.warn('Cannot send message:', { active: stompClientRef.current?.active, bookingId: currentBookingId, content });
      setError("Impossible d'envoyer le message. Vérifiez votre connexion.");
      return;
    }

    setError(null);

    try {
      const messagePayload = {
        bookingId: currentBookingId,
        content: content.trim(),
      };
      stompClientRef.current.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(messagePayload),
      });
      console.log('Message sent:', messagePayload);
    } catch (sendError) {
      // ✅ CORRECTION : Renommé 'e' en 'sendError'
      console.error('Error sending message via WebSocket:', sendError);
      setError("Erreur lors de l'envoi du message.");
    }
  }, [currentBookingId]);

  const value = {
    isOpen,
    openChat,
    closeChat,
    messages,
    sendMessage,
    isLoadingMessages,
    currentBookingId,
    error,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};