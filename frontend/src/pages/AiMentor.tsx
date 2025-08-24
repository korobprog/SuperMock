import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import { ProfileHeader } from '@/components/ui/profile-header';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';

export function AiMentor() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();

  const handleBack = () => {
    navigate('/applications');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 pb-24 md:pb-4">
      <div className="max-w-4xl mx-auto pt-16 sm:pt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={20} />
            <span>Назад</span>
          </Button>
          <Logo size="md" clickable={true} />
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Profile Header */}
        <ProfileHeader />

        {/* AI Mentor Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🤖 AI Ментор
            </h1>
            <p className="text-gray-600">
              Ваш персональный помощник для подготовки к собеседованиям
            </p>
          </div>

          {/* Placeholder content */}
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Функция в разработке
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Скоро здесь появится умный AI-ментор, который поможет вам подготовиться к собеседованиям и дойти до оффера.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
}
