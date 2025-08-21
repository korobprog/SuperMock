import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/ui/logo';
import { useAppTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { apiHistory, apiFeedback } from '@/lib/api';
import { FeedbackModal } from '@/components/ui/feedback-modal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  User,
  MessageSquare,
  Briefcase,
  Globe,
} from 'lucide-react';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';

interface Session {
  id: string;
  interviewer_user_id: number;
  candidate_user_id: number;
  profession: string;
  language: string;
  slot_utc: string;
  created_at: string;
  status: string;
  jitsi_room: string;
  interviewer_tools?: string[];
  candidate_tools?: string[];
}

interface Feedback {
  id: number;
  session_id: string;
  from_user_id: number;
  to_user_id: number;
  rating: number;
  comments: string;
  created_at: string;
}

interface HistoryData {
  sessions: Session[];
  feedbacks: Feedback[];
}

export function History() {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [targetUser, setTargetUser] = useState<{
    id: number;
    name?: string;
  } | null>(null);
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const userId = useAppStore((s) => s.userId);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) {
        setError(t('history.userIdNotFound'));
        setIsLoading(false);
        return;
      }

      try {
        const data = await apiHistory(userId);
        setHistoryData(data);
      } catch (err) {
        setError(t('history.failedToLoadHistory'));
        console.error('Error fetching history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return t('history.unknownDate');
      }
      
      // Get locale from current language setting
      const locale = t('notifications.dateLocale') || 'ru-RU';
      
      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', dateStr, error);
      return t('history.unknownDate');
    }
  };

  const getUserRole = (session: Session) => {
    return session.interviewer_user_id === userId ? 'interviewer' : 'candidate';
  };

  const getUserTools = (session: Session) => {
    const userRole = getUserRole(session);
    return userRole === 'interviewer'
      ? session.interviewer_tools || []
      : session.candidate_tools || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionFeedbacks = (sessionId: string) => {
    return (
      historyData?.feedbacks.filter((f) => f.session_id === sessionId) || []
    );
  };

  // Check if user can give feedback for a session
  const canGiveFeedback = (session: Session) => {
    if (!userId || session.status !== 'completed') return false;

    const sessionFeedbacks = getSessionFeedbacks(session.id);
    const hasGivenFeedback = sessionFeedbacks.some(
      (f) => f.from_user_id === userId
    );

    return !hasGivenFeedback;
  };

  // Handle feedback button click
  const handleGiveFeedback = (session: Session) => {
    if (!userId) return;

    // Determine target user (simplified - in real app you'd get this from session data)
    const isInterviewer = session.interviewer_user_id === userId;
    const targetUserId = isInterviewer
      ? session.candidate_user_id
      : session.interviewer_user_id;

    setSelectedSession(session);
    setTargetUser({
      id: targetUserId,
      name: isInterviewer ? t('history.candidateShort') : t('history.interviewerShort'),
    });
    setShowFeedbackModal(true);
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: {
    rating: number;
    comments: string;
  }) => {
    if (!selectedSession || !userId || !targetUser) return;

    setIsSubmittingFeedback(true);
    try {
      await apiFeedback({
        sessionId: selectedSession.id,
        fromUserId: userId,
        toUserId: targetUser.id,
        rating: feedback.rating,
        comments: feedback.comments,
      });

      // Refresh history data
      const data = await apiHistory(userId);
      setHistoryData(data);

      // Close modal
      setShowFeedbackModal(false);
      setSelectedSession(null);
      setTargetUser(null);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4">
        <div className="max-w-md mx-auto pt-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('history.backToMain')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 pb-24 md:pb-4">
      <div className="max-w-4xl mx-auto pt-16 sm:pt-20">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" clickable={true} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {t('history.title')}
          </h1>
        </div>

        {/* Content */}
        {!historyData?.sessions.length ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {t('history.noInterviews')}
              </p>
              <Button onClick={() => navigate('/')}>
                {t('history.startNewInterview')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {historyData.sessions.map((session) => {
              const userRole = getUserRole(session);
              const sessionFeedbacks = getSessionFeedbacks(session.id);
              const receivedFeedback = sessionFeedbacks.find(
                (f) => f.to_user_id === userId
              );
              const givenFeedback = sessionFeedbacks.find(
                (f) => f.from_user_id === userId
              );

              return (
                <Card key={session.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          {session.profession}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(session.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            {session.language.toUpperCase()}
                          </div>
                        </div>
                        {/* {t('tools.userTools')} */}
                        {(() => {
                          const userTools = getUserTools(session);
                          if (userTools.length > 0) {
                            return (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {t('tools.yourTools')}:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {userTools.map((tool, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {tool}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant="secondary"
                          className={getStatusColor(session.status)}
                        >
                          {t(`history.status.${session.status}`) || session.status}
                        </Badge>
                        <Badge variant="outline">
                          <User className="h-3 w-3 mr-1" />
                          {userRole === 'interviewer'
                            ? t('history.interviewer')
                            : t('history.candidate')}
                        </Badge>
                        {canGiveFeedback(session) && (
                          <Button
                            size="sm"
                            onClick={() => handleGiveFeedback(session)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                          >
                            <Star className="mr-2 h-3 w-3" />
                            {t('history.giveFeedback') || 'Оставить фидбек'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {(receivedFeedback || givenFeedback) && (
                    <>
                      <Separator />
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          {/* Полученный отзыв */}
                          {receivedFeedback && (
                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-green-800">
                                  {t('history.receivedFeedback')}
                                </h4>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">
                                    {receivedFeedback.rating}/5
                                  </span>
                                </div>
                              </div>
                              {receivedFeedback.comments && (
                                <p className="text-sm text-green-700">
                                  "{receivedFeedback.comments}"
                                </p>
                              )}
                              <p className="text-xs text-green-600 mt-2">
                                {formatDate(receivedFeedback.created_at)}
                              </p>
                            </div>
                          )}

                          {/* Данный отзыв */}
                          {givenFeedback && (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-blue-800">
                                  {t('history.givenFeedback')}
                                </h4>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">
                                    {givenFeedback.rating}/5
                                  </span>
                                </div>
                              </div>
                              {givenFeedback.comments && (
                                <p className="text-sm text-blue-700">
                                  "{givenFeedback.comments}"
                                </p>
                              )}
                              <p className="text-xs text-blue-600 mt-2">
                                {formatDate(givenFeedback.created_at)}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedSession(null);
          setTargetUser(null);
        }}
        onSubmit={handleFeedbackSubmit}
        sessionId={selectedSession?.id || ''}
        targetUser={targetUser || undefined}
        isLoading={isSubmittingFeedback}
      />

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
}
