import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { VideoControls } from '@/components/ui/video-controls';
import { VideoInterface } from '@/components/ui/video-interface';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { TelegramAuthCallback } from '@/components/ui/telegram-login';
import { TelegramUser } from '@/lib/telegram-auth';
import { validateEnv } from '@/lib/env';
import { applyTelegramDesktopFixes } from '@/lib/telegram-desktop-fixes';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { ProfessionSelection } from './pages/ProfessionSelection';
import { Applications } from './pages/Applications';
import { AiMentor } from './pages/AiMentor';
import { Trainer } from './pages/Trainer';
import { Materials } from './pages/Materials';
import { Calendar } from './pages/Calendar';
import { Roadmap } from './pages/Roadmap';

import { LanguageSelection } from './pages/LanguageSelection';
import { ToolSelection } from './pages/ToolSelection';
import { ApiKeySetup } from './pages/ApiKeySetup';
import { TimeSelection } from './pages/TimeSelection';
import { Interview } from './pages/Interview';
import { InterviewFeedback } from './pages/InterviewFeedback';
import { InterviewResultsPage } from './pages/InterviewResults';
import { Notifications } from './pages/Notifications';
import { History } from './pages/History';
import { WaitingRoom } from './pages/WaitingRoom';
import { DevWaitingRoom } from './pages/DevWaitingRoom';
import { Profile } from './pages/Profile';
import TelegramAuthSuccess from './pages/TelegramAuthSuccess';
import DevTest from './pages/DevTest';
import { DevRouteGuard } from './components/ui/dev-route-guard';

const queryClient = new QueryClient();

function AppContent() {
  const { i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const { setTelegramUser } = useAppStore();

  // Проверяем переменные окружения при запуске
  useEffect(() => {
    if (!validateEnv()) {
      console.error('App: Missing required environment variables');
    }
  }, []);

  // Применяем исправления для Telegram Desktop
  useEffect(() => {
    applyTelegramDesktopFixes();
  }, []);

  // Синхронизируем язык интерфейса с состоянием store при навигации
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const handleTelegramAuth = (user: TelegramUser) => {
    console.log('App: Received Telegram auth:', user);
    setTelegramUser(user);
  };

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {/* Обработчик callback от Telegram OAuth */}
      <TelegramAuthCallback onAuth={handleTelegramAuth} />

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/profession" element={<ProfessionSelection />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/ai-mentor" element={<AiMentor />} />
        <Route path="/trainer" element={<Trainer />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/language" element={<LanguageSelection />} />
        <Route path="/tools" element={<ToolSelection />} />
        <Route path="/api-key-setup" element={<ApiKeySetup />} />
        <Route path="/time" element={<TimeSelection />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/feedback" element={<InterviewFeedback />} />
        <Route path="/results" element={<InterviewResultsPage />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/history" element={<History />} />
        <Route path="/waiting/:sessionId" element={<WaitingRoom />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/telegram-auth-success" element={<TelegramAuthSuccess />} />
        {/* Development-only routes with extra protection */}
        <Route
          path="/dev-test"
          element={
            <DevRouteGuard>
              <DevTest />
            </DevRouteGuard>
          }
        />
        <Route
          path="/dev-waiting"
          element={
            <DevRouteGuard>
              <DevWaitingRoom />
            </DevRouteGuard>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
      {/* Принудительный импорт для включения в сборку */}
      <div style={{ display: 'none' }}>
        <VideoControls
          localStream={null}
          isVideoActive={false}
          isAudioActive={false}
          isScreenSharing={false}
          onToggleVideo={() => {}}
          onToggleAudio={() => {}}
          onToggleScreenShare={() => {}}
          onDeviceChange={() => {}}
          onSettingsChange={() => {}}
          onFullscreen={() => {}}
          isFullscreen={false}
        />
        <VideoInterface
          localVideoRef={{ current: null }}
          remoteVideoRef={{ current: null }}
          localStream={null}
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
