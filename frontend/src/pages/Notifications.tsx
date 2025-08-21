import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';
import { useAppStore } from '@/lib/store';
import { useAppTranslation } from '@/lib/i18n';
import { useHapticFeedback } from '@/lib/haptic-feedback';
import { apiGetSession } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/lib/config';
import {
  apiGetNotifications,
  apiMarkNotificationRead,
  apiDeleteNotification,
  apiClearAllNotifications,
} from '@/lib/api';
import {
  ArrowLeft,
  Bell,
  Trash2,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  MessageSquare,
  Video,
  Calendar,
  Users,
  Info,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  status: string;
  priority: number;
  createdAt: string;
  readAt?: string | null;
  actionData?: string | null;
  titleKey?: string | null;
  messageKey?: string | null;
  messageData?: string | null;
};

// Утилиты для форматирования текста
const truncateText = (text: string, maxLength: number = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const truncateRoomName = (roomName: string, maxLength: number = 30) => {
  if (roomName.length <= maxLength) return roomName;
  return roomName.substring(0, maxLength) + '...';
};

const extractAndFormatLinks = (text: string) => {
  // Регулярное выражение для поиска URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Это URL - создаем сокращенную версию с возможностью копирования
      const shortUrl = truncateText(part, 40);
      return { type: 'link', text: shortUrl, fullUrl: part, key: index };
    }
    return { type: 'text', text: part, key: index };
  });
};

const formatNotificationMessage = (message: string, onSuccess: () => void, t: any) => {
  const lines = message.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Проверяем, содержит ли строка информацию об инструментах
    if (line.includes(t('notifications.tools')) || line.includes(t('notifications.yourTools'))) {
      const [label, tools] = line.split(':');
      const toolList = tools?.trim().split(', ') || [];
      return (
        <div key={lineIndex} className="mt-2">
          <span className="text-gray-700 font-medium">{label}:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {toolList.map((tool, toolIndex) => (
              <Badge key={toolIndex} variant="outline" className="text-xs">
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      );
    }
    
    // Проверяем, содержит ли строка ссылку
    if (line.includes('http')) {
      const parts = extractAndFormatLinks(line);
      return (
        <div key={lineIndex} className={lineIndex === 0 ? 'mb-1' : ''}>
          {parts.map((part) => {
            if (part.type === 'link') {
              return (
                <span key={part.key} className="inline-flex items-center gap-1">
                  <span className="text-blue-600 font-medium">{part.text}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700"
                    onClick={() => {
                      navigator.clipboard.writeText(part.fullUrl);
                      onSuccess();
                    }}
                    title={t('notifications.copyLink')}
                  >
                    <Copy size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700"
                    onClick={() => window.open(part.fullUrl, '_blank')}
                    title={t('notifications.openLink')}
                  >
                    <ExternalLink size={12} />
                  </Button>
                </span>
              );
            }
            return <span key={part.key}>{part.text}</span>;
          })}
        </div>
      );
    }
    
    // Проверяем, содержит ли строка название комнаты
    if (line.includes(t('notifications.room'))) {
      const [label, roomName] = line.split(':');
      const truncatedRoomName = truncateRoomName(roomName?.trim() || '');
      return (
        <div key={lineIndex} className={lineIndex === 0 ? 'mb-1' : ''}>
          <span className="text-gray-700 font-medium">{label}:</span>{' '}
          <span className="text-gray-600">{truncatedRoomName}</span>
          {roomName && roomName.length > 30 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-gray-700"
              onClick={() => {
                navigator.clipboard.writeText(roomName.trim());
                onSuccess();
              }}
              title={t('notifications.copyRoomName')}
            >
              <Copy size={12} />
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div key={lineIndex} className={lineIndex === 0 ? 'mb-1' : ''}>
        {line}
      </div>
    );
  });
};

const formatTranslatedMessage = (messageKey: string, messageData: string | null, onSuccess: () => void, t: any) => {
  try {
    const data = messageData ? JSON.parse(messageData) : {};
    const translatedMessage = t(messageKey, data);
    
    // Разбиваем переведенное сообщение на строки
    const lines = translatedMessage.split('\n');
    
    return lines.map((line: string, lineIndex: number) => {
      // Проверяем, содержит ли строка информацию об инструментах
      if (line.includes(t('notifications.tools')) || line.includes(t('notifications.yourTools'))) {
        const [label, tools] = line.split(':');
        const toolList = tools?.trim().split(', ') || [];
        return (
          <div key={lineIndex} className="mt-2">
            <span className="text-gray-700 font-medium">{label}:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {toolList.map((tool: string, toolIndex: number) => (
                <Badge key={toolIndex} variant="outline" className="text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        );
      }
      
      // Проверяем, содержит ли строка ссылку
      if (line.includes('http')) {
        const parts = extractAndFormatLinks(line);
        return (
          <div key={lineIndex} className={lineIndex === 0 ? 'mb-1' : ''}>
            {parts.map((part) => {
              if (part.type === 'link') {
                return (
                  <span key={part.key} className="inline-flex items-center gap-1">
                    <span className="text-blue-600 font-medium">{part.text}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700"
                      onClick={() => {
                        navigator.clipboard.writeText(part.fullUrl);
                        onSuccess();
                      }}
                      title={t('notifications.copyLink')}
                    >
                      <Copy size={12} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700"
                      onClick={() => window.open(part.fullUrl, '_blank')}
                      title={t('notifications.openLink')}
                    >
                      <ExternalLink size={12} />
                    </Button>
                  </span>
                );
              }
              return <span key={part.key}>{part.text}</span>;
            })}
          </div>
        );
      }
      
      // Проверяем, содержит ли строка название комнаты
      if (line.includes(t('notifications.room'))) {
        const [label, roomName] = line.split(':');
        const truncatedRoomName = truncateRoomName(roomName?.trim() || '');
        return (
          <div key={lineIndex} className={lineIndex === 0 ? 'mb-1' : ''}>
            <span className="text-gray-700 font-medium">{label}:</span>{' '}
            <span className="text-gray-600">{truncatedRoomName}</span>
            {roomName && roomName.length > 30 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  navigator.clipboard.writeText(roomName.trim());
                  onSuccess();
                }}
                title={t('notifications.copyRoomName')}
              >
                <Copy size={12} />
              </Button>
            )}
          </div>
        );
      }
      
      return (
        <div key={lineIndex} className={lineIndex === 0 ? 'mb-1' : ''}>
          {line}
        </div>
      );
    });
  } catch (error) {
    console.error('Error formatting translated message:', error);
    return <div className="text-sm text-gray-600">{t(messageKey)}</div>;
  }
};

export function Notifications() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { light, success, warning, error: hapticError } = useHapticFeedback();
  const userId = useAppStore((s) => s.userId);
  const setSession = useAppStore((s) => s.setSession);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<{ total: number; unread: number }>({
    total: 0,
    unread: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Функция для форматирования времени
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return t('notifications.justNow');
    if (diffMinutes < 60) return t('notifications.minutesAgo', { count: diffMinutes });
    if (diffHours < 24) return t('notifications.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('notifications.daysAgo', { count: diffDays });

    return date.toLocaleDateString(t('notifications.dateLocale', { fallback: 'ru-RU' }), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Функция для получения иконки по типу уведомления
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview':
        return <Video size={16} className="text-blue-600" />;
      case 'match':
        return <Users size={16} className="text-green-600" />;
      case 'system':
        return <Info size={16} className="text-gray-600" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <MessageSquare size={16} className="text-purple-600" />;
    }
  };

  // Функция для получения цвета приоритета
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800 border-red-200';
      case 2:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  async function load() {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetNotifications(userId);
      setItems(res.items || []);
      setStats(res.stats || { total: 0, unread: 0 });
    } catch (err) {
      setError(t('notifications.error'));
      hapticError();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // subscribe to realtime notifications (prevent multiple connections)
  useEffect(() => {
    if (!userId) return;
    // Для Socket.IO используем тот же домен, что и для API, но с правильным протоколом
    const socketUrl = API_CONFIG.baseURL 
      ? API_CONFIG.baseURL.replace('https://', 'wss://').replace('http://', 'ws://')
      : undefined;
    
    const s = io(socketUrl || undefined, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      forceNew: true,
      query: { userId: String(userId) },
    });
    setSocket(s);
    s.on('notification', () => {
      load();
    });
    return () => {
      s.disconnect();
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const markRead = async (id: number) => {
    try {
      await apiMarkNotificationRead(id);
      await load();
      success();
    } catch (err) {
      hapticError();
    }
  };

  const remove = async (id: number) => {
    try {
      await apiDeleteNotification(id);
      await load();
      success();
    } catch (err) {
      hapticError();
    }
  };

  const clearAll = async () => {
    if (!userId) return;
    try {
      await apiClearAllNotifications(userId);
      await load();
      success();
    } catch (err) {
      hapticError();
    }
  };

  // Обработка действий в уведомлениях
  const handleNotificationAction = (actionData: string) => {
    try {
      const data = JSON.parse(actionData);

      if (data.type === 'join' && data.sessionId) {
        // Переходим на страницу ожидания
        navigate(`/waiting/${data.sessionId}`);
        success();
      } else if (data.type === 'interview' && data.sessionId) {
        // Переходим прямо в интервью
        navigate(`/interview?sessionId=${data.sessionId}`);
        success();
      }
    } catch (err) {
      console.error('Error parsing action data:', err);
      hapticError();
    }
  };

  const handleBack = () => {
    light();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray pb-24 md:pb-0">
      {/* Logo */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 pt-16 sm:pt-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-center mb-4">
            <Logo size="lg" clickable={true} />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-full telegram-desktop-fix"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  {t('notifications.title')}
                </h1>
              </div>
            </div>

            {stats.total > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={loading}
                className="hidden sm:flex items-center gap-2 telegram-desktop-fix"
              >
                <Trash2 size={14} />
                {t('notifications.clearAll')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Card */}
        <Card className="mb-6 shadow-sm">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t('notifications.total')}:{' '}
                  <span className="font-semibold text-gray-900">
                    {stats.total}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {t('notifications.unread')}:{' '}
                  <span className="font-semibold text-blue-600">
                    {stats.unread}
                  </span>
                </div>
              </div>

              {/* Mobile clear all button */}
              {stats.total > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  disabled={loading}
                  className="sm:hidden telegram-desktop-fix"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 size={20} className="animate-spin" />
              <span>{t('notifications.loading')}</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent>
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        {!loading && !error && (
          <div className="space-y-4">
            {items.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all duration-200 hover:shadow-md ${
                  !notification.readAt
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-gray-200'
                }`}
              >
                <CardContent>
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                            {notification.titleKey ? t(notification.titleKey) : notification.title}
                          </h3>
                          <div className="text-sm text-gray-600">
                            {notification.messageKey 
                              ? formatTranslatedMessage(notification.messageKey, notification.messageData, success, t)
                              : formatNotificationMessage(notification.message, success, t)
                            }
                          </div>
                        </div>

                        {/* Priority Badge */}
                        {notification.priority > 1 && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(
                              notification.priority
                            )}`}
                          >
                            {notification.priority === 1
                              ? t('notifications.priority.high')
                              : notification.priority === 2
                              ? t('notifications.priority.medium')
                              : t('notifications.priority.low')}
                          </Badge>
                        )}
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Clock size={12} />
                        <span>{formatTime(notification.createdAt)}</span>
                      </div>

                      {/* Action Button */}
                      {(() => {
                        try {
                          if (!notification.actionData) return null;
                          const data = JSON.parse(notification.actionData);
                          if (data?.type === 'join' && data?.sessionId) {
                            return (
                              <Button
                                variant="default"
                                size="sm"
                                className="mb-3 telegram-desktop-fix"
                                onClick={() =>
                                  handleNotificationAction(
                                    notification.actionData!
                                  )
                                }
                              >
                                <Video size={14} className="mr-2" />
                                {t('notifications.joinWaitingRoom')}
                              </Button>
                            );
                          }
                        } catch (e) {
                          // ignore malformed actionData
                        }
                        return null;
                      })()}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.readAt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markRead(notification.id)}
                            className="text-xs telegram-desktop-fix"
                          >
                            <Check size={12} className="mr-1" />
                            {t('notifications.markAsRead')}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(notification.id)}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 telegram-desktop-fix"
                        >
                          <Trash2 size={12} className="mr-1" />
                          {t('notifications.delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State */}
            {items.length === 0 && !loading && (
              <Card className="border-dashed border-gray-300">
                <CardContent className="text-center">
                  <Bell size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('notifications.noNotifications')}
                  </h3>
                  <p className="text-gray-500">
                    {t('notifications.emptyStateDescription')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
}
