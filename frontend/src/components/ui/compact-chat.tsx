import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  MessageCircle,
  Smile,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ParticipantStatus } from './participant-status';
import { CompactLanguageSelector } from './compact-language-selector';
import { io, Socket } from 'socket.io-client';
import { createApiUrl } from '@/lib/config';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}

interface QuickMessage {
  text: string;
  emoji: string;
  category: 'greeting' | 'status' | 'question' | 'reaction';
}

const QUICK_MESSAGES: QuickMessage[] = [
  // Приветствия
  { text: 'chat.messages.greeting.hello', emoji: '👋', category: 'greeting' },
  { text: 'chat.messages.greeting.goodDay', emoji: '🌞', category: 'greeting' },
  { text: 'chat.messages.greeting.greetings', emoji: '🙂', category: 'greeting' },
  { text: 'chat.messages.greeting.niceToMeet', emoji: '😊', category: 'greeting' },
  
  // Статус
  { text: 'chat.messages.status.ready', emoji: '✅', category: 'status' },
  { text: 'chat.messages.status.nervous', emoji: '😅', category: 'status' },
  { text: 'chat.messages.status.great', emoji: '😊', category: 'status' },
  { text: 'chat.messages.status.needMinute', emoji: '⏳', category: 'status' },
  { text: 'chat.messages.status.checkingSound', emoji: '🎤', category: 'status' },
  
  // Вопросы
  { text: 'chat.messages.question.howAreYou', emoji: '🤔', category: 'question' },
  { text: 'chat.messages.question.readyToStart', emoji: '🎯', category: 'question' },
  { text: 'chat.messages.question.anyQuestions', emoji: '❓', category: 'question' },
  { text: 'chat.messages.question.everythingClear', emoji: '🤷', category: 'question' },
  
  // Реакции
  { text: 'chat.messages.reaction.excellent', emoji: '👍', category: 'reaction' },
  { text: 'chat.messages.reaction.agree', emoji: '✅', category: 'reaction' },
  { text: 'chat.messages.reaction.interesting', emoji: '🤓', category: 'reaction' },
  { text: 'chat.messages.reaction.gotIt', emoji: '👌', category: 'reaction' },
  { text: 'chat.messages.reaction.thankYou', emoji: '🙏', category: 'reaction' },
  
  // Интервью
  { text: 'chat.messages.question.shallWeStart', emoji: '🚀', category: 'question' },
  { text: 'chat.messages.status.readyToAnswer', emoji: '💪', category: 'status' },
  { text: 'chat.messages.reaction.greatQuestion', emoji: '💡', category: 'reaction' },
];

interface CompactChatProps {
  sessionId: string;
  participants: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  currentUserId: string;
}

export function CompactChat({ sessionId, participants, currentUserId }: CompactChatProps) {
  const { t } = useTranslation();
  const { telegramUser } = useAppStore();
  
  // Отладочная информация при инициализации компонента
  console.log('🎯 CompactChat initialized with:');
  console.log('🆔 sessionId:', sessionId);
  console.log('👥 participants:', participants);
  console.log('🆔 currentUserId:', currentUserId);
  console.log('👤 telegramUser:', telegramUser);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // WebSocket соединение для чата
  useEffect(() => {
    if (!sessionId || !currentUserId) return;

    // Создаем WebSocket соединение
    const socketUrl = createApiUrl('').replace('http://', 'ws://').replace('https://', 'wss://');
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected for chat');
      setIsConnected(true);
      
      // Присоединяемся к комнате сессии
      newSocket.emit('join_room', { sessionId, userId: currentUserId });
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected from chat');
      setIsConnected(false);
    });

    newSocket.on('chat_message', (payload) => {
      console.log('📨 Received chat message:', payload);
      if (payload && typeof payload === 'object' && payload.user && payload.message) {
        const participant = participants.find(p => p.name === payload.user) || 
                          participants.find(p => p.id === payload.user);
        
        addMessage(
          participant?.id || payload.user,
          participant?.name || payload.user,
          payload.message
        );
      }
    });

    newSocket.on('joined', () => {
      console.log('✅ Joined chat room');
    });

    newSocket.on('join_denied', (payload) => {
      console.log('❌ Join denied:', payload);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId, currentUserId, participants]);

  // Автоматическая прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Добавление системного сообщения при подключении участников
  useEffect(() => {
    if (participants.length > 0) {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        userId: 'system',
        userName: t('chat.system'),
        message: t('chat.participantsConnected', { count: participants.length }),
        timestamp: new Date(),
        isSystem: true,
      };
      setMessages(prev => [systemMessage]);
    }
  }, [participants.length]);

  const addMessage = (userId: string, userName: string, message: string) => {
    console.log('📨 addMessage called with:', { userId, userName, message });
    
    const newMsg: ChatMessage = {
      id: `${userId}-${Date.now()}`,
      userId,
      userName,
      message,
      timestamp: new Date(),
    };
    
    console.log('📝 Created message object:', newMsg);
    
    setMessages(prev => {
      const updated = [...prev, newMsg];
      console.log('📊 Messages updated, total count:', updated.length);
      console.log('📋 All messages:', updated);
      return updated;
    });
  };

  const handleSendMessage = () => {
    console.log('🔍 handleSendMessage called');
    console.log('📝 newMessage:', newMessage);
    console.log('👥 participants:', participants);
    console.log('🆔 currentUserId:', currentUserId);
    
    if (newMessage.trim() && socket && isConnected) {
      const currentUser = participants.find(p => p.id === currentUserId);
      console.log('👤 currentUser found:', currentUser);
      
      if (currentUser) {
        console.log('✅ Sending message via WebSocket...');
        
        // Отправляем сообщение через WebSocket
        socket.emit('chat_message', {
          sessionId,
          user: currentUser.name,
          message: newMessage.trim()
        });
        
        // Добавляем сообщение локально для мгновенного отображения
        addMessage(currentUserId, currentUser.name, newMessage.trim());
        setNewMessage('');
        setIsTyping(false);
        console.log('✅ Message sent successfully!');
      } else {
        console.log('❌ Current user not found!');
        // Fallback: use first participant or create default user
        const fallbackUser = participants[0] || { id: 'default', name: 'Пользователь' };
        console.log('🔄 Using fallback user:', fallbackUser);
        
        socket.emit('chat_message', {
          sessionId,
          user: fallbackUser.name,
          message: newMessage.trim()
        });
        
        addMessage(fallbackUser.id, fallbackUser.name, newMessage.trim());
        setNewMessage('');
        setIsTyping(false);
      }
    } else if (!socket || !isConnected) {
      console.log('❌ WebSocket not connected, using local fallback');
      // Fallback для случая, когда WebSocket не подключен
      if (newMessage.trim()) {
        const currentUser = participants.find(p => p.id === currentUserId);
        if (currentUser) {
          addMessage(currentUserId, currentUser.name, newMessage.trim());
          setNewMessage('');
          setIsTyping(false);
        }
      }
    } else {
      console.log('❌ Message is empty');
    }
  };

  const handleQuickMessage = (quickMessage: QuickMessage) => {
    console.log('🚀 handleQuickMessage called with:', quickMessage);
    console.log('👥 participants:', participants);
    console.log('🆔 currentUserId:', currentUserId);
    
    const currentUser = participants.find(p => p.id === currentUserId);
    console.log('👤 currentUser found:', currentUser);
    
    if (currentUser) {
      console.log('✅ Sending quick message via WebSocket...');
      const messageText = `${quickMessage.emoji} ${t(quickMessage.text)}`;
      
      if (socket && isConnected) {
        socket.emit('chat_message', {
          sessionId,
          user: currentUser.name,
          message: messageText
        });
      }
      
      addMessage(currentUserId, currentUser.name, messageText);
      setShowQuickMessages(false);
      console.log('✅ Quick message sent successfully!');
    } else {
      console.log('❌ Current user not found for quick message!');
      // Fallback: use first participant or create default user
      const fallbackUser = participants[0] || { id: 'default', name: t('chat.you') };
      console.log('🔄 Using fallback user for quick message:', fallbackUser);
      const messageText = `${quickMessage.emoji} ${t(quickMessage.text)}`;
      
      if (socket && isConnected) {
        socket.emit('chat_message', {
          sessionId,
          user: fallbackUser.name,
          message: messageText
        });
      }
      
      addMessage(fallbackUser.id, fallbackUser.name, messageText);
      setShowQuickMessages(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('⌨️ Key pressed:', e.key, 'Shift:', e.shiftKey);
    
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('🚀 Enter pressed, calling handleSendMessage');
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCurrentUserName = () => {
    return participants.find(p => p.id === currentUserId)?.name || t('chat.you');
  };

  const isCurrentUser = (userId: string) => userId === currentUserId;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      {/* Заголовок чата */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-blue-600" />
          <span className="text-sm font-medium">{t('chat.title')}</span>
          <Badge variant="outline" className="text-xs">
            {messages.length - 1} {/* Исключаем системное сообщение */}
          </Badge>
          {/* Индикатор состояния подключения */}
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
               title={isConnected ? 'Подключено' : 'Не подключено'} />
        </div>
        <div className="flex items-center gap-2">
          {isTyping && (
            <span className="text-xs text-muted-foreground animate-pulse">
              {t('chat.typing')}
            </span>
          )}
          <CompactLanguageSelector />
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Содержимое чата */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Статус участников */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <ParticipantStatus
              participants={participants.map(p => ({
                ...p,
                isOnline: true, // В dev режиме все онлайн
                isTyping: false,
              }))}
              currentUserId={currentUserId}
            />
          </div>
          
          {/* Сообщения */}
          <ScrollArea className="h-64 p-3">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    isCurrentUser(message.userId) ? 'items-end' : 'items-start'
                  }`}
                >
                  {!message.isSystem && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {message.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      message.isSystem
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-center'
                        : isCurrentUser(message.userId)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {message.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Быстрые сообщения */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                {t('chat.quickMessages')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('🔘 Quick messages toggle clicked, current state:', showQuickMessages);
                  setShowQuickMessages(!showQuickMessages);
                }}
                className="h-6 px-2"
              >
                <Smile size={14} />
              </Button>
            </div>
            
            {showQuickMessages && (
              <div className="grid grid-cols-3 gap-1 mb-3">
                {QUICK_MESSAGES.map((quickMessage, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🔘 Quick message button clicked:', quickMessage);
                      handleQuickMessage(quickMessage);
                    }}
                    className="h-8 text-xs p-1"
                  >
                    {quickMessage.emoji} {t(quickMessage.text)}
                  </Button>
                ))}
              </div>
            )}

            {/* Поле ввода */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => {
                  console.log('📝 Input changed:', e.target.value);
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.inputPlaceholder')}
                className="flex-1 text-sm"
                maxLength={200}
              />
              <Button
                onClick={() => {
                  console.log('🔘 Send button clicked');
                  handleSendMessage();
                }}
                disabled={!newMessage.trim()}
                size="sm"
                className="px-3"
              >
                <Send size={14} />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {newMessage.length}/200
              </span>
              <span className="text-xs text-muted-foreground">
                {t('chat.enterToSend')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
