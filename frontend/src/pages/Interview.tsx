import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/ui/logo';
import {
  Video,
  MessageCircle,
  Code,
  Clock,
  Phone,
  PhoneOff,
  LogOut,
  Star,
  Menu,
  X,
  ChevronUp,
  ChevronDown,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
} from 'lucide-react';
import { FeedbackModal } from '@/components/ui/feedback-modal';
import { ExitConfirmDialog } from '@/components/ui/exit-confirm-dialog';
import { VideoInterface } from '@/components/ui/video-interface';
import { VideoControls } from '@/components/ui/video-controls';
import { useAppTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { useTelegramFullscreen } from '@/hooks/use-telegram-fullscreen';
import { getQuestionsForProfession } from '@/lib/questions';
import { OpenRouterAPI } from '@/lib/openrouter-api';
import { getPromptForProfession } from '@/lib/ai-prompts';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG, ICE_CONFIG, getIceConfig } from '@/lib/config';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import StackblitzEditor from '@/components/StackblitzEditor';
import { apiCompleteSession, apiFeedback, apiGetSession } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';

// Убираем захардкоженные вопросы, теперь они будут подгружаться по профессии

export function Interview() {
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [videoLayout, setVideoLayout] = useState<
    'grid' | 'spotlight' | 'side-by-side'
  >('spotlight');
  const [videoProvider, setVideoProvider] = useState<
    'none' | 'webrtc' | 'jitsi'
  >('webrtc');
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<
    { user: string; message: string; at: number }[]
  >([]);
  const [timeElapsed, setTimeElapsed] = useState('00:00:00');
  const [languageMode, setLanguageMode] = useState<
    'javascript' | 'python' | 'java' | 'typescript'
  >('javascript');
  const [editorMode, setEditorMode] = useState<'codemirror' | 'stackblitz'>(
    'codemirror'
  );
  const [editorWidth, setEditorWidth] = useState<'auto' | '360px' | '400px' | '500px' | 'full'>('auto');
  const [code, setCode] = useState<string>(
    'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n'
  );
  const [selfOnline, setSelfOnline] = useState<boolean>(false);
  const [partnerOnline, setPartnerOnline] = useState<{
    online: boolean;
    role?: 'interviewer' | 'candidate' | null;
  }>({ online: false, role: null });
  const sessionId = useAppStore((s) => s.sessionId);
  const jitsiRoom = useAppStore((s) => s.jitsiRoom);
  const profession = useAppStore((s) => s.profession);
  const role = useAppStore((s) => s.role);
  const userSettings = useAppStore((s) => s.userSettings);
  const userId = useAppStore((s) => s.userId);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<number | null>(null);
  const startAtRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const [searchParams] = useSearchParams();
  const urlSessionId = searchParams.get('sessionId');
  const isEarlyJoin = searchParams.get('early') === 'true';

  // Принудительный импорт для предотвращения tree-shaking
  const _videoControlsComponent = VideoControls;

  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Настройка полноэкранного режима в Telegram Mini Apps
  useTelegramFullscreen();

  // Modal states
  const [showExitConfirmDialog, setShowExitConfirmDialog] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [targetUser, setTargetUser] = useState<{
    id: number;
    name?: string;
  } | null>(null);

  // Mobile interface states
  const isMobile = useIsMobile();
  const [mobileActiveTab, setMobileActiveTab] = useState<
    'video' | 'code' | 'chat' | 'questions'
  >('video');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop interface states
  const [desktopActiveTab, setDesktopActiveTab] = useState<
    'video' | 'code' | 'chat' | 'questions'
  >('video');

  // Получаем вопросы для текущей профессии
  const staticQuestionKeys = useMemo(() => {
    if (!profession) return [];
    return getQuestionsForProfession(profession);
  }, [profession]);

  // Загружаем данные сессии из URL параметров
  useEffect(() => {
    if (urlSessionId) {
      const loadSessionData = async () => {
        try {
          const sessionData = await apiGetSession(
            urlSessionId,
            userId?.toString()
          );

          // Проверяем авторизацию пользователя
          if (
            sessionData.interviewerUserId === userId?.toString() ||
            sessionData.candidateUserId === userId?.toString()
          ) {
            // Определяем роль пользователя в этой сессии
            const userRole =
              sessionData.interviewerUserId === userId?.toString()
                ? 'interviewer'
                : 'candidate';

            // Обновляем store с данными сессии
            useAppStore.setState({
              sessionId: sessionData.id,
              jitsiRoom: sessionData.jitsiRoom,
              profession: sessionData.profession,
              role: userRole,
            });

            // Если это досрочный вход, показываем предупреждение
            if (isEarlyJoin) {
              console.log('Early join mode activated');
            }
          } else {
            console.error('User not authorized for this session');
            navigate('/');
          }
        } catch (error) {
          console.error('Error loading session data:', error);
          navigate('/');
        }
      };

      loadSessionData();
    }
  }, [urlSessionId, userId, navigate, isEarlyJoin]);

  // Переводим статические ключи вопросов в тексты
  const staticQuestions = useMemo(() => {
    return staticQuestionKeys.map((key) => t(key));
  }, [staticQuestionKeys, t]);

  // Загружаем вопросы (ИИ или статические)
  const loadQuestions = useCallback(async () => {
    if (!profession) return;

    setIsLoadingQuestions(true);
    setQuestionsError(null);

    try {
      // Debug logging
      console.log('Loading questions with settings:', {
        userId,
        useAIGeneration: userSettings.useAIGeneration,
        hasApiKey: !!userSettings.openRouterApiKey,
        profession,
        role,
      });

      const shouldUseAI =
        userSettings.useAIGeneration &&
        userSettings.openRouterApiKey &&
        profession &&
        userId; // Add userId check

      if (shouldUseAI) {
        const prompt = getPromptForProfession(profession!);
        if (prompt && userSettings.openRouterApiKey) {
          console.log('Attempting to generate AI questions...');

          try {
            const api = new OpenRouterAPI(userSettings.openRouterApiKey);

            // Test connection first
            const isConnected = await api.testConnection();
            if (!isConnected) {
              console.warn(
                'OpenRouter connection failed, falling back to static questions'
              );
              setQuestions(staticQuestions);
              return;
            }

            const aiQuestions = await api.generateQuestions(
              profession!,
              prompt.systemPrompt,
              prompt.questionPrompt,
              userSettings.preferredModel,
              userSettings.questionsCount,
              userSettings.questionsLevel
            );

            if (aiQuestions.length > 0) {
              setQuestions(aiQuestions);
            } else {
              console.warn('No AI questions generated, using static questions');
              setQuestions(staticQuestions);
            }
          } catch (apiError) {
            console.error('AI generation failed:', apiError);
            const errorMessage =
              apiError instanceof Error
                ? apiError.message
                : 'Ошибка генерации вопросов';
            setQuestionsError(
              `${errorMessage}. Проверьте API ключ в настройках профиля.`
            );
            setQuestions(staticQuestions);
          }
        } else {
          console.log('No prompt or API key, using static questions');
          setQuestions(staticQuestions);
        }
      } else {
        console.log(
          'AI generation disabled or missing requirements, using static questions'
        );
        setQuestions(staticQuestions);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setQuestionsError(
        error instanceof Error ? error.message : 'Ошибка загрузки вопросов'
      );
      setQuestions(staticQuestions);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [profession, role, userSettings, staticQuestions, userId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    // Восстанавливаем время начала из localStorage или создаем новое
    const savedStartTime = localStorage.getItem(`interview_start_${sessionId}`);
    if (savedStartTime) {
      startAtRef.current = parseInt(savedStartTime);
    } else {
      startAtRef.current = Date.now();
      localStorage.setItem(`interview_start_${sessionId}`, startAtRef.current.toString());
    }

    timerRef.current = window.setInterval(() => {
      if (!startAtRef.current) return;
      const diff = Date.now() - startAtRef.current;
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setTimeElapsed(`${h}:${m}:${s}`);
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [sessionId]);

  useEffect(() => {
    // Для Socket.IO используем тот же домен, что и для API, но с правильным протоколом
    const socketUrl = API_CONFIG.baseURL 
      ? API_CONFIG.baseURL.replace('https://', 'wss://').replace('http://', 'ws://')
      : undefined;
    
    const s = io(socketUrl || undefined, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      forceNew: true,
      query: userId ? { userId: String(userId) } : undefined,
    });
    socketRef.current = s;
    if (sessionId && userId) {
      s.emit('join_room', { sessionId, userId });
      s.emit('presence', { sessionId, userId, role });
      s.on('joined', () => {
        setSelfOnline(true);
      });
      s.on('join_denied', (payload) => {
        // Navigate away if not authorized for session
        navigate('/');
      });
      s.on('chat_message', (payload) => {
        // Validate payload structure to prevent React error #130
        if (
          payload &&
          typeof payload === 'object' &&
          typeof payload.user === 'string' &&
          typeof payload.message === 'string' &&
          typeof payload.at === 'number'
        ) {
          setMessages((prev) => [...prev, payload]);
        } else {
          console.warn('Invalid chat_message payload:', payload);
          // Create a safe fallback message
          const safeMessage = {
            user: 'Unknown',
            message: String(payload?.message || 'Invalid message'),
            at: Date.now(),
          };
          setMessages((prev) => [...prev, safeMessage]);
        }
      });
      s.on('presence_update', (data) => {
        if (!data) return;
        // If it's the partner coming online, mark partner status
        if (typeof data.userId === 'number' && data.userId !== userId) {
          setPartnerOnline({
            online: true,
            role:
              data.role ??
              (role === 'interviewer' ? 'candidate' : 'interviewer'),
          });
          // also append system message
          setMessages((prev) => [
            ...prev,
            {
              user: 'Система',
              message: 'Партнер вошёл в комнату',
              at: Date.now(),
            },
          ]);
        }
      });
      s.on('code_update', (data: { code?: string; from?: number }) => {
        // Validate code update data
        if (
          data &&
          typeof data === 'object' &&
          typeof data.code === 'string' &&
          (typeof data.from !== 'number' || data.from !== userId)
        ) {
          setCode(data.code);
        } else {
          console.warn('Invalid code_update payload:', data);
        }
      });

      // WebRTC signaling handlers
      s.on('webrtc_offer', async ({ sdp }) => {
        try {
          if (!pcRef.current) return;
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(sdp)
          );
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          s.emit('webrtc_answer', { sessionId, sdp: answer, from: userId });
        } catch (e) {
          console.error('Error setting remote description:', e);
        }
      });
      s.on('webrtc_answer', async ({ sdp }) => {
        try {
          if (!pcRef.current) return;
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(sdp)
          );
        } catch (e) {
          console.error('Error applying answer SDP', e);
        }
      });
      s.on('webrtc_ice', async ({ candidate }) => {
        try {
          if (!pcRef.current || !candidate) return;
          await pcRef.current.addIceCandidate(candidate);
        } catch (e) {
          console.error('Error adding remote ICE candidate', e);
        }
      });
    }
    return () => {
      try {
        if (sessionId)
          s.emit('presence', { sessionId, userId, role, left: true });
      } catch (e) {
        console.warn('presence cleanup failed', e);
      }
      s.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, userId, role, navigate]);

  // Start/stop video and P2P handling
  useEffect(() => {
    async function startWebRTC() {
      if (videoProvider !== 'webrtc' || !isVideoActive) return;
      if (pcRef.current) return; // already started

      // Get dynamic ICE configuration with TURN credentials
      const iceConfig = await getIceConfig(userId?.toString());
      const pc = new RTCPeerConnection(iceConfig);
      pcRef.current = pc;

      pc.onicecandidate = (ev) => {
        if (ev.candidate && socketRef.current && sessionId) {
          socketRef.current.emit('webrtc_ice', {
            sessionId,
            candidate: ev.candidate,
            from: userId,
          });
        }
      };

      pc.ontrack = (ev) => {
        const [stream] = ev.streams;
        if (remoteVideoRef.current && stream) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: isAudioActive,
          video: isVideoActive,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      } catch (err) {
        console.error('getUserMedia failed', err);
        setIsVideoActive(false);
        setIsAudioActive(false);
        return;
      }

      // If we are the first to create an offer
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        if (socketRef.current && sessionId) {
          socketRef.current.emit('webrtc_offer', {
            sessionId,
            sdp: offer,
            from: userId,
          });
        }
      } catch (e) {
        console.error('createOffer failed', e);
      }
    }

    async function stopWebRTC() {
      if (pcRef.current) {
        try {
          pcRef.current.close();
        } catch (e) {
          console.warn('pc close failed', e);
        }
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }

    if (videoProvider === 'webrtc' && isVideoActive) {
      startWebRTC();
    } else {
      stopWebRTC();
    }

    return () => {
      // safety cleanup on unmount or provider switch
      if (videoProvider !== 'webrtc' || !isVideoActive) {
        try {
          pcRef.current?.close();
        } catch (e) {
          console.warn('pc close failed', e);
        }
        pcRef.current = null;
      }
    };
  }, [videoProvider, isVideoActive, isAudioActive, sessionId, userId]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const my = { user: 'Вы', message: newMessage, at: Date.now() };
    setMessages((prev) => [...prev, my]);
    if (socketRef.current && sessionId) {
      socketRef.current.emit('chat_message', {
        sessionId,
        user: `User#${userId ?? ''}`,
        message: newMessage,
      });
    }
    setNewMessage('');
  };

  // Функции управления видео
  const handleToggleVideo = () => {
    setIsVideoActive(!isVideoActive);
  };

  const handleToggleAudio = () => {
    setIsAudioActive(!isAudioActive);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      // Остановить показ экрана
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);

      // Восстановить локальное видео
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    } else {
      // Начать показ экрана
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        // Показать экран вместо локального видео
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Обработчик остановки показа экрана
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } catch (error) {
        console.error('Error starting screen share:', error);
      }
    }
  };

  const handleDeviceChange = (deviceId: string, type: 'video' | 'audio') => {
    // Здесь можно добавить логику смены устройств
    console.log(`Changing ${type} device to:`, deviceId);
  };

  const handleSettingsChange = (settings: {
    videoQuality: 'low' | 'medium' | 'high';
    audioQuality: 'low' | 'medium' | 'high';
  }) => {
    // Здесь можно добавить логику изменения качества
    console.log('Video settings changed:', settings);
  };

  // Cleanup resources function
  const cleanupResources = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    // Очищаем время начала сессии из localStorage
    if (sessionId) {
      localStorage.removeItem(`interview_start_${sessionId}`);
    }
  };

  // Handle complete interview
  const handleCompleteInterview = async () => {
    if (!sessionId || !userId) return;

    setIsCompletingSession(true);
    try {
      // 1. Complete session on server
      const result = await apiCompleteSession(sessionId);
      console.log('Session completed:', result);

      // 2. Set target user for feedback (simplified - in real app you'd get this from session data)
      setTargetUser({ id: userId, name: 'Партнер' });

      // 3. Show feedback modal
      setShowFeedbackModal(true);
      setShowExitConfirmDialog(false);
    } catch (error) {
      console.error('Failed to complete interview:', error);
      // Fallback to simple exit
      cleanupResources();
      navigate('/');
    } finally {
      setIsCompletingSession(false);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: {
    rating: number;
    comments: string;
  }) => {
    if (!sessionId || !userId || !targetUser) return;

    setIsSubmittingFeedback(true);
    try {
      await apiFeedback({
        sessionId,
        fromUserId: userId,
        toUserId: targetUser.id,
        rating: feedback.rating,
        comments: feedback.comments,
      });

      // Close modal and navigate to history
      setShowFeedbackModal(false);
      cleanupResources();
      navigate('/history');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Still navigate to history even if feedback fails
      setShowFeedbackModal(false);
      cleanupResources();
      navigate('/history');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Handle simple exit (without completing)
  const handleSimpleExit = () => {
    cleanupResources();
    setShowExitConfirmDialog(false);
    navigate('/');
  };

  const handleExitInterview = () => {
    // Show exit confirmation dialog
    setShowExitConfirmDialog(true);
  };

  // Функция для получения ширины редактора
  const getEditorWidth = () => {
    switch (editorWidth) {
      case '360px':
        return '360px';
      case '400px':
        return '400px';
      case '500px':
        return '500px';
      case 'full':
        return '100%';
      default:
        return 'auto';
    }
  };

  const extensions = useMemo(() => {
    switch (languageMode) {
      case 'python':
        return [python()];
      case 'java':
        return [java()];
      default:
        return [
          javascript({ jsx: true, typescript: languageMode === 'typescript' }),
        ];
    }
  }, [languageMode]);

  return (
    <div className="min-h-screen bg-background">
      {/* Logo */}
      <div className="bg-card border-b border-border p-4 pt-16 sm:pt-20">
        <div className="flex justify-center mb-4">
          <Logo size="md" clickable={true} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                ИВ
              </span>
            </div>
            <div>
              <h2 className="font-medium text-foreground">
                {profession || 'Frontend Developer'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isMobile ? 'Собес...' : 'Собеседование'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-1">
    
            {selfOnline && (
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                Вы онлайн
              </Badge>
            )}
            {partnerOnline.online && (
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                Партнер онлайн
              </Badge>
            )}
            {/* Кнопки управления - уменьшенные */}
            <Button
              variant={isVideoActive ? 'destructive' : 'default'}
              size="sm"
              onClick={() => {
                if (isVideoActive) {
                  setIsVideoActive(false);
                  setIsAudioActive(false);
                } else {
                  setIsVideoActive(true);
                  setIsAudioActive(true);
                }
              }}
              className="h-8 px-2"
            >
              {isVideoActive ? <PhoneOff size={14} /> : <Phone size={14} />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitInterview}
              className="h-8 px-2"
            >
              {t('interview.exit')}
            </Button>

            {/* Кнопка бургер меню для мобильной версии */}
            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-8 px-2"
              >
                {isMobileMenuOpen ? <X size={14} /> : <Menu size={14} />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && isMobileMenuOpen && (
        <div className="lg:hidden bg-card border-b border-border shadow-lg">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">Управление</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={isVideoActive ? 'destructive' : 'default'}
                size="sm"
                onClick={() => {
                  if (isVideoActive) {
                    setIsVideoActive(false);
                    setIsAudioActive(false);
                  } else {
                    setIsVideoActive(true);
                    setIsAudioActive(true);
                  }
                }}
                className="h-10"
              >
                {isVideoActive ? <PhoneOff size={16} className="mr-2" /> : <Phone size={16} className="mr-2" />}
                {isVideoActive ? 'Завершить' : 'Начать'} видео
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExitInterview}
                className="h-10"
              >
                <LogOut size={16} className="mr-2" />
                Выйти
              </Button>
            </div>

            <div className="pt-2 border-t border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">Настройки видео</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Провайдер видео:</span>
                  <select
                    value={videoProvider}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setVideoProvider(
                        e.target.value as 'none' | 'webrtc' | 'jitsi'
                      )
                    }
                    className="text-xs bg-transparent border border-border rounded px-2 py-1"
                  >
                    <option value="none">Без видео</option>
                    <option value="webrtc">WebRTC (p2p)</option>
                    <option value="jitsi">Jitsi</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Редактор кода:</span>
                  <select
                    value={editorMode}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setEditorMode(
                        e.target.value as 'codemirror' | 'stackblitz'
                      )
                    }
                    className="text-xs bg-transparent border border-border rounded px-2 py-1"
                  >
                    <option value="codemirror">CodeMirror</option>
                    <option value="stackblitz">StackBlitz</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ширина редактора:</span>
                  <select
                    value={editorWidth}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setEditorWidth(
                        e.target.value as 'auto' | '360px' | '400px' | '500px' | 'full'
                      )
                    }
                    className="text-xs bg-transparent border border-border rounded px-2 py-1"
                  >
                    <option value="auto">Авто</option>
                    <option value="360px">360px</option>
                    <option value="400px">400px</option>
                    <option value="500px">500px</option>
                    <option value="full">Полная</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Управление видео и звуком */}
            <div className="pt-2 border-t border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">Управление видео и звуком</h4>
              <div className="space-y-3">
                {/* Управление видео */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Видео:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isVideoActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsVideoActive(!isVideoActive)}
                      className="h-8 px-3"
                    >
                      {isVideoActive ? <Video size={14} /> : <VideoOff size={14} />}
                    </Button>
                  </div>
                </div>

                {/* Управление звуком */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Звук:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isAudioActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsAudioActive(!isAudioActive)}
                      className="h-8 px-3"
                    >
                      {isAudioActive ? <Mic size={14} /> : <MicOff size={14} />}
                    </Button>
                  </div>
                </div>

                {/* Демонстрация экрана */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Демонстрация экрана:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isScreenSharing ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsScreenSharing(!isScreenSharing)}
                      className="h-8 px-3"
                    >
                      {isScreenSharing ? <MonitorOff size={14} /> : <Monitor size={14} />}
                    </Button>
                  </div>
                </div>

                {/* Макет видео */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Макет видео:</span>
                  <select
                    value={videoLayout}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setVideoLayout(
                        e.target.value as 'grid' | 'spotlight' | 'side-by-side'
                      )
                    }
                    className="text-xs bg-transparent border border-border rounded px-2 py-1"
                  >
                    <option value="grid">Сетка</option>
                    <option value="spotlight">Фокус</option>
                    <option value="side-by-side">Рядом</option>
                  </select>
                </div>

                {/* Язык программирования */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Язык:</span>
                  <select
                    value={languageMode}
                    onChange={(e) =>
                      setLanguageMode(
                        e.target.value as
                          | 'javascript'
                          | 'python'
                          | 'java'
                          | 'typescript'
                      )
                    }
                    className="text-xs bg-transparent border border-border rounded px-2 py-1"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                </div>
              </div>
            </div>

            {import.meta.env.DEV && (
              <div className="pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const res = await (
                      await import('@/lib/api')
                    ).apiDevLatestSession();
                    if (res?.session) {
                      setMessages((prev) => [
                        ...prev,
                        {
                          user: 'Система',
                          message: `Отладка: sessionId=${res.session.id}\nroom=${res.session.jitsiRoom}`,
                          at: Date.now(),
                        },
                      ]);
                    }
                    if (socketRef.current && sessionId) {
                      socketRef.current.emit('debug_ping', {
                        sessionId,
                        text: 'ping',
                      });
                    }
                  }}
                  className="w-full"
                >
                  Debug Session
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Interface */}
      {isMobile ? (
        <div className="h-[calc(100vh-80px)] flex flex-col">
          {/* Mobile Content */}
          <div className="flex-1 overflow-hidden pb-24">
            {mobileActiveTab === 'video' && (
              <div className="h-full flex flex-col">
                {/* Video Area */}
                <div className="flex-1 bg-black relative">
                  {isVideoActive ? (
                    <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
                      {videoProvider === 'jitsi' && jitsiRoom ? (
                        <iframe
                          src={`${API_CONFIG.jitsiBaseURL}/${jitsiRoom}#config.prejoinPageEnabled=false&config.disableThirdPartyRequests=true`}
                          allow="camera; microphone; fullscreen; display-capture; autoplay"
                          className="w-full h-full border-0"
                        />
                      ) : videoProvider === 'webrtc' ? (
                        <VideoInterface
                          localVideoRef={localVideoRef}
                          remoteVideoRef={remoteVideoRef}
                          localStream={localStreamRef.current}
                          isVideoActive={isVideoActive}
                          isAudioActive={isAudioActive}
                          isScreenSharing={isScreenSharing}
                          onToggleVideo={handleToggleVideo}
                          onToggleAudio={handleToggleAudio}
                          onToggleScreenShare={handleToggleScreenShare}
                          onDeviceChange={handleDeviceChange}
                          onSettingsChange={handleSettingsChange}
                          partnerOnline={partnerOnline.online}
                          layout={videoLayout}
                          onLayoutChange={setVideoLayout}
                        />
                      ) : (
                        <div className="text-center text-white">
                          <Video size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="text-lg">
                            {t('interview.waitingForMatch')}
                          </p>
                          <p className="text-sm opacity-75">Video not started</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Video size={48} className="mx-auto mb-4" />
                        <p className="text-lg">{t('interview.videoInactive')}</p>
                        <div className="flex flex-col items-center gap-3 mt-4">
                          <select
                            value={videoProvider}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              setVideoProvider(
                                e.target.value as 'none' | 'webrtc' | 'jitsi'
                              )
                            }
                            className="text-xs bg-transparent border border-border rounded px-3 py-2"
                          >
                            <option value="none">Без видео</option>
                            <option value="webrtc">WebRTC (p2p)</option>
                            <option value="jitsi">Jitsi</option>
                          </select>
                          <Button
                            onClick={() => {
                              setIsVideoActive(true);
                              setIsAudioActive(true);
                            }}
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Video size={16} />
                            {t('interview.startVideo')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Video Controls - время убрано, теперь фиксированное */}
              </div>
            )}

            {mobileActiveTab === 'code' && (
              <div className="h-full flex flex-col w-full" style={{ minWidth: getEditorWidth() }}>
                {/* Code Editor Header - уменьшенный и адаптивный */}
                                  <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30 w-full" style={{ minWidth: getEditorWidth() }}>
                  <div className="flex items-center space-x-2">
                    <Code size={14} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      {t('interview.codeEditor')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <select
                      value={editorMode}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setEditorMode(
                          e.target.value as 'codemirror' | 'stackblitz'
                        )
                      }
                      className="text-xs bg-transparent border border-border rounded px-1 py-0.5 min-w-0"
                    >
                      <option value="codemirror">CM</option>
                      <option value="stackblitz">SB</option>
                    </select>
                    <select
                      value={languageMode}
                      onChange={(e) =>
                        setLanguageMode(
                          e.target.value as
                            | 'javascript'
                            | 'python'
                            | 'java'
                            | 'typescript'
                        )
                      }
                      className="text-xs bg-transparent border border-border rounded px-1 py-0.5 min-w-0"
                    >
                      <option value="javascript">JS</option>
                      <option value="typescript">TS</option>
                      <option value="python">PY</option>
                      <option value="java">Java</option>
                    </select>
                  </div>
                </div>

                {/* Code Editor - увеличенный и адаптивный */}
                <div className="flex-1 overflow-hidden min-h-0 w-full" style={{ minWidth: getEditorWidth() }}>
                  <div className="h-full w-full" style={{ minWidth: getEditorWidth() }}>
                    {editorMode === 'codemirror' ? (
                      <CodeMirror
                        value={code}
                        height="100%"
                        width="100%"
                        extensions={extensions}
                        onChange={(val) => {
                          setCode(val);
                        }}
                        theme="dark"
                        style={{
                          minWidth: getEditorWidth(),
                          width: '100%',
                          height: '100%',
                          fontSize: '14px',
                          lineHeight: '1.4',
                        }}
                      />
                    ) : (
                      <div className="h-full w-full overflow-hidden" style={{ minWidth: getEditorWidth() }}>
                        <StackblitzEditor
                          apiKey={userSettings.stackblitzApiKey || ''}
                          code={code}
                          language={languageMode}
                          onChange={setCode}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {mobileActiveTab === 'chat' && (
              <div className="h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-3 border-b border-border">
                  <h3 className="font-medium text-foreground">
                    {t('interview.chat')}
                  </h3>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">
                          {String(msg.user)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {msg.at ? new Date(msg.at).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <p className="text-sm text-foreground bg-muted/30 p-2 rounded">
                        {String(msg.message)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-border">
                  <div className="flex space-x-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('interview.enterMessage')}
                      className="resize-none text-sm"
                      rows={2}
                    />
                    <Button
                      onClick={handleSendMessage}
                      size="sm"
                      className="px-3"
                    >
                      →
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {mobileActiveTab === 'questions' && (
              <div className="h-full flex flex-col">
                {/* Questions Header */}
                <div className="p-3 border-b border-border">
                  <h3 className="font-medium text-foreground">
                    {t('interview.questions')}
                  </h3>
                </div>

                {/* Questions List */}
                <div className="flex-1 p-3 overflow-y-auto">
                  <div className="space-y-3">
                    {isLoadingQuestions ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Загрузка вопросов...</p>
                      </div>
                    ) : questionsError ? (
                      <div className="text-center py-8">
                        <p className="text-destructive mb-4">{questionsError}</p>
                        <Button onClick={loadQuestions} variant="outline">
                          Попробовать снова
                        </Button>
                      </div>
                    ) : questions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          Вопросы не найдены для данной профессии
                        </p>
                      </div>
                    ) : (
                      questions.map((question, index) => (
                        <div
                          key={index}
                          className="p-3 bg-muted/50 rounded-lg text-sm text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                        >
                          <span className="text-xs text-primary font-medium">
                            #{index + 1}
                          </span>
                          <p className="mt-1">{question}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Фиксированное время */}
          <div className="fixed bottom-16 left-0 right-0 z-40 bg-card/90 backdrop-blur-sm border-t border-border/30">
            <div className="text-center py-2 text-sm text-muted-foreground font-medium">
              {timeElapsed}
            </div>
          </div>

          {/* Mobile Tab Navigation - ФИКСИРОВАНО ВНИЗУ */}
          <div className="fixed bottom-0 left-0 right-0 z-50 flex bg-card/95 backdrop-blur-md border-t border-border/50">
            <button
              onClick={() => setMobileActiveTab('video')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                mobileActiveTab === 'video'
                  ? 'text-primary bg-primary/10 relative'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Video size={16} className="mx-auto mb-1" />
              Видео
              {mobileActiveTab === 'video' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setMobileActiveTab('code')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                mobileActiveTab === 'code'
                  ? 'text-primary bg-primary/10 relative'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Code size={16} className="mx-auto mb-1" />
              Код
              {mobileActiveTab === 'code' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setMobileActiveTab('chat')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                mobileActiveTab === 'chat'
                  ? 'text-primary bg-primary/10 relative'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <MessageCircle size={16} className="mx-auto mb-1" />
              Чат
              {mobileActiveTab === 'chat' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setMobileActiveTab('questions')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                mobileActiveTab === 'questions'
                  ? 'text-primary bg-primary/10 relative'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Star size={16} className="mx-auto mb-1" />
              Вопросы
              {mobileActiveTab === 'questions' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Desktop Interface */
        <div className="h-[calc(100vh-80px)] flex flex-col">
          {/* Main Content */}
          <div className="flex-1 flex">
            {/* Video and Code Area */}
            <div className="flex-1 flex flex-col">
              {/* Video Area */}
              <div className="h-1/2 bg-telegram-dark relative">
                {isVideoActive ? (
                  <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
                    {videoProvider === 'jitsi' && jitsiRoom ? (
                      <iframe
                        src={`${API_CONFIG.jitsiBaseURL}/${jitsiRoom}#config.prejoinPageEnabled=false&config.disableThirdPartyRequests=true`}
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        className="w-full h-full border-0"
                      />
                    ) : videoProvider === 'webrtc' ? (
                      <VideoInterface
                        localVideoRef={localVideoRef}
                        remoteVideoRef={remoteVideoRef}
                        localStream={localStreamRef.current}
                        isVideoActive={isVideoActive}
                        isAudioActive={isAudioActive}
                        isScreenSharing={isScreenSharing}
                        onToggleVideo={handleToggleVideo}
                        onToggleAudio={handleToggleAudio}
                        onToggleScreenShare={handleToggleScreenShare}
                        onDeviceChange={handleDeviceChange}
                        onSettingsChange={handleSettingsChange}
                        partnerOnline={partnerOnline.online}
                        layout={videoLayout}
                        onLayoutChange={setVideoLayout}
                      />
                    ) : (
                      <div className="text-center text-white">
                        <Video size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">
                          {t('interview.waitingForMatch')}
                        </p>
                        <p className="text-sm opacity-75">Video not started</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Video size={48} className="mx-auto mb-4" />
                      <p className="text-lg">{t('interview.videoInactive')}</p>
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <select
                          value={videoProvider}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setVideoProvider(
                              e.target.value as 'none' | 'webrtc' | 'jitsi'
                            )
                          }
                          className="text-xs bg-transparent border border-border rounded px-2 py-1"
                        >
                          <option value="none">Без видео</option>
                          <option value="webrtc">WebRTC (p2p)</option>
                          <option value="jitsi">Jitsi</option>
                        </select>
                        <Button
                          onClick={() => {
                            setIsVideoActive(true);
                            setIsAudioActive(true);
                          }}
                          className="mt-0"
                        >
                          {t('interview.startVideo')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Code Editor */}
              <div className="h-1/2 border-t border-border">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                    <div className="flex items-center space-x-2">
                      <Code size={16} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {t('interview.codeEditor')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={editorMode}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setEditorMode(
                            e.target.value as 'codemirror' | 'stackblitz'
                          )
                        }
                        className="text-xs bg-transparent border border-border rounded px-2 py-1"
                      >
                        <option value="codemirror">CodeMirror</option>
                        <option value="stackblitz">StackBlitz</option>
                      </select>
                      <select
                        value={languageMode}
                        onChange={(e) =>
                          setLanguageMode(
                            e.target.value as
                              | 'javascript'
                              | 'python'
                              | 'java'
                              | 'typescript'
                          )
                        }
                        className="text-xs bg-transparent border border-border rounded px-2 py-1"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="h-full">
                      {editorMode === 'codemirror' ? (
                        <CodeMirror
                          value={code}
                          height="100%"
                          extensions={extensions}
                          onChange={(val) => {
                            setCode(val);
                            if (socketRef.current && sessionId) {
                              socketRef.current.emit('code_update', {
                                sessionId,
                                code: val,
                                from: userId,
                              });
                            }
                          }}
                          theme="dark"
                        />
                      ) : (
                        <StackblitzEditor
                          apiKey={userSettings.stackblitzApiKey || ''}
                          code={code}
                          language={languageMode}
                          onChange={(val) => {
                            setCode(val);
                            if (socketRef.current && sessionId) {
                              socketRef.current.emit('code_update', {
                                sessionId,
                                code: val,
                                from: userId,
                              });
                            }
                          }}
                          onError={(msg) => {
                            setEditorMode('codemirror');
                            setMessages((prev) => [
                              ...prev,
                              { user: 'Система', message: msg, at: Date.now() },
                            ]);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 border-l border-border bg-card flex flex-col">
              {/* Questions */}
              <div className="flex-1 p-4 border-b border-border">
                <h3 className="font-medium text-foreground mb-3 flex items-center">
                  <MessageCircle size={16} className="mr-2" />
                  {t('interview.questions')}
                  {userSettings.useAIGeneration &&
                    userSettings.openRouterApiKey && (
                      <span className="ml-2 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full">
                        AI
                      </span>
                    )}
                </h3>
                <div className="space-y-2">
                  {isLoadingQuestions ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {userSettings.useAIGeneration
                          ? 'Генерируются вопросы...'
                          : 'Загрузка вопросов...'}
                      </span>
                    </div>
                  ) : questionsError ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {questionsError}
                      </p>
                      <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                        Показаны стандартные вопросы
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/profile')}
                        className="mt-2 w-full"
                      >
                        Проверить настройки API
                      </Button>
                    </div>
                  ) : null}

                  {!isLoadingQuestions &&
                    questions.map((question, index) => (
                      <div
                        key={index}
                        className="p-3 bg-muted/50 rounded-lg text-sm text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                      >
                        <span className="text-xs text-primary font-medium">
                          #{index + 1}
                        </span>
                        <p className="mt-1">{question}</p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Chat */}
              <div className="h-80 flex flex-col">
                <div className="p-3 border-b border-border">
                  <h3 className="font-medium text-foreground">
                    {t('interview.chat')}
                  </h3>
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">
                          {String(msg.user)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {msg.at ? new Date(msg.at).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <p className="text-sm text-foreground bg-muted/30 p-2 rounded">
                        {String(msg.message)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border">
                  <div className="flex space-x-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('interview.enterMessage')}
                      className="resize-none text-sm"
                      rows={2}
                    />
                    <Button
                      onClick={handleSendMessage}
                      size="sm"
                      className="px-3"
                    >
                      →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Tab Navigation - ВНИЗУ */}
          <div className="flex bg-card/80 backdrop-blur-sm">
            <button
              onClick={() => setDesktopActiveTab('video')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                desktopActiveTab === 'video'
                  ? 'text-primary bg-primary/10 relative'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Video size={16} className="mx-auto mb-1" />
              Видео
              {desktopActiveTab === 'video' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setDesktopActiveTab('code')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                desktopActiveTab === 'code'
                  ? 'text-primary bg-primary/10 relative'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Code size={16} className="mx-auto mb-1" />
              Код
              {desktopActiveTab === 'code' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setDesktopActiveTab('chat')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                desktopActiveTab === 'chat'
                  ? 'text-primary bg-primary/10 relative'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <MessageCircle size={16} className="mx-auto mb-1" />
              Чат
              {desktopActiveTab === 'chat' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setDesktopActiveTab('questions')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                desktopActiveTab === 'questions'
                  ? 'text-primary bg-primary/10 relative'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Star size={16} className="mx-auto mb-1" />
              Вопросы
              {desktopActiveTab === 'questions' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Принудительный рендер VideoInterface для включения в сборку */}
      <div style={{ display: 'none' }}>
        <VideoInterface
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          localStream={localStreamRef.current}
          isVideoActive={false}
          isAudioActive={false}
          isScreenSharing={false}
          onToggleVideo={() => {}}
          onToggleAudio={() => {}}
          onToggleScreenShare={() => {}}
          onDeviceChange={() => {}}
          onSettingsChange={() => {}}
          partnerOnline={false}
          layout="grid"
          onLayoutChange={() => {}}
        />
      </div>

      {/* Exit Confirmation Dialog */}
      <ExitConfirmDialog
        isOpen={showExitConfirmDialog}
        onClose={() => setShowExitConfirmDialog(false)}
        onConfirm={handleSimpleExit}
        onComplete={handleCompleteInterview}
        isLoading={isCompletingSession}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        sessionId={sessionId || ''}
        targetUser={targetUser || undefined}
        isLoading={isSubmittingFeedback}
      />
    </div>
  );
}
