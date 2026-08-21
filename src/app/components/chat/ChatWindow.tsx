// src/app/components/chat/ChatWindow.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat, ChatMessage } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Send, X, Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ChatWindow() {
  const t = useTranslations('chat');
  const {
    isOpen,
    closeChat,
    messages,
    sendMessage,
    isLoadingMessages,
    currentBookingId,
    error
  } = useChat();
  const { user } = useAuth();
  const { markConversationAsRead } = useNotifications();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ Ouvrir cette conversation (ou recevoir un nouveau message dedans pendant qu'elle est
  // déjà ouverte) marque comme lues les notifications de chat correspondantes — jamais celles
  // d'autres conversations ou d'autres types (incident, statut...).
  useEffect(() => {
    if (isOpen && currentBookingId) {
      markConversationAsRead(currentBookingId);
    }
  }, [isOpen, currentBookingId, messages.length, markConversationAsRead]);

  // Récupérer la marque du véhicule depuis le premier message (si disponible)
  const vehicleBrand = messages.length > 0 ? messages[0].vehicleBrand : '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  const resolveSenderRole = (senderRole: string | undefined) => {
    if (senderRole === 'Propriétaire') return t('roleOwner');
    if (senderRole === 'Locataire') return t('roleRenter');
    return senderRole || t('defaultSender');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  if (!isOpen || !user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-8 sm:left-auto sm:right-8 w-full max-w-sm h-[60vh] sm:h-[70vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-transform duration-300 ease-out z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold">
          {vehicleBrand
            ? t('reservationTitleWithVehicle', { vehicle: vehicleBrand, id: currentBookingId ?? '' })
            : t('reservationTitle', { id: currentBookingId ?? '' })}
        </h3>
        <button
          onClick={closeChat}
          className="p-2 -m-2 rounded-full hover:bg-white/20 transition-colors"
          title={t('closeChat')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error && messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center px-4">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3"/>
            <p className="text-red-600 font-medium mb-1">{t('loadError')}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500 dark:text-gray-400">{t('noMessages')}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSender = msg.senderId === user.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-xl ${
                    isSender
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                  }`}
                >
                  {!isSender && (
                    <p className="text-xs font-semibold mb-1 text-primary">
                      {resolveSenderRole(msg.senderRole)}
                    </p>
                  )}
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isSender ? 'text-primary-foreground/80' : 'text-gray-500 dark:text-gray-400'} text-right`}>
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Affichage de l'erreur d'envoi */}
      {error && !isLoadingMessages && (
        <div className="px-4 pb-2 text-xs text-red-600 flex items-center bg-white dark:bg-gray-800">
          <AlertCircle size={14} className="mr-1"/> {error}
        </div>
      )}

      {/* Zone de saisie */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('messagePlaceholder')}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title={t('send')}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}