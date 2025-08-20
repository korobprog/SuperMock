import { useRef, useEffect, useState } from 'react';
import { VideoControls } from './video-controls';
import { Button } from './button';
import { Video, VideoOff, User, Users } from 'lucide-react';

interface VideoInterfaceProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  localStream: MediaStream | null;
  isVideoActive: boolean;
  isAudioActive: boolean;
  isScreenSharing: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleScreenShare: () => void;
  onDeviceChange: (deviceId: string, type: 'video' | 'audio') => void;
  onSettingsChange: (settings: {
    videoQuality: 'low' | 'medium' | 'high';
    audioQuality: 'low' | 'medium' | 'high';
  }) => void;
  partnerOnline: boolean;
  layout: 'grid' | 'spotlight' | 'side-by-side';
  onLayoutChange: (layout: 'grid' | 'spotlight' | 'side-by-side') => void;
}

export function VideoInterface({
  localVideoRef,
  remoteVideoRef,
  localStream,
  isVideoActive,
  isAudioActive,
  isScreenSharing,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onDeviceChange,
  onSettingsChange,
  partnerOnline,
  layout,
  onLayoutChange,
}: VideoInterfaceProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Обработчик полноэкранного режима
  const handleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!isFullscreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
        (videoContainerRef.current as any).webkitRequestFullscreen();
      } else if ((videoContainerRef.current as any).msRequestFullscreen) {
        (videoContainerRef.current as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // Слушаем изменения полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
      );
      document.removeEventListener(
        'msfullscreenchange',
        handleFullscreenChange
      );
    };
  }, []);

  // Получаем классы для разных layouts
  const getLayoutClasses = () => {
    switch (layout) {
      case 'grid':
        return 'grid grid-cols-2 gap-2';
      case 'spotlight':
        return 'grid grid-cols-1 gap-2';
      case 'side-by-side':
        return 'flex gap-2';
      default:
        return 'grid grid-cols-2 gap-2';
    }
  };

  // Получаем размеры для разных layouts
  const getVideoClasses = (isLocal: boolean) => {
    const baseClasses = 'bg-black rounded-lg overflow-hidden relative';

    switch (layout) {
      case 'grid':
        return `${baseClasses} aspect-video`;
      case 'spotlight':
        return `${baseClasses} aspect-video`;
      case 'side-by-side':
        return `${baseClasses} flex-1 aspect-video`;
      default:
        return `${baseClasses} aspect-video`;
    }
  };

  // Определяем, какие видео показывать в зависимости от layout
  const shouldShowLocalVideo = layout !== 'spotlight' || !partnerOnline;
  const shouldShowRemoteVideo = layout !== 'spotlight' || partnerOnline;

  return (
    <div ref={videoContainerRef} className="w-full h-full bg-black relative">
      {/* Видео контейнер */}
      <div className={`w-full h-full ${getLayoutClasses()} p-2`}>
        {/* Локальное видео */}
        {shouldShowLocalVideo && (
          <div className={getVideoClasses(true)}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Индикатор локального видео */}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              Вы (Локально)
            </div>
            {/* Индикатор состояния камеры */}
            {!isVideoActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white">
                  <VideoOff size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Камера выключена</p>
                </div>
              </div>
            )}
            {/* Специальный индикатор для spotlight режима когда партнер не онлайн */}
            {layout === 'spotlight' && !partnerOnline && (
              <div className="absolute bottom-2 right-2 bg-blue-500/80 text-white text-xs px-2 py-1 rounded">
                Показывается ваше видео
              </div>
            )}
          </div>
        )}

        {/* Удаленное видео */}
        {shouldShowRemoteVideo && (
          <div className={getVideoClasses(false)}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Индикатор удаленного видео */}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              Партнер
              {partnerOnline && (
                <span className="ml-1 inline-block w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </div>
            {/* Специальный индикатор для spotlight режима когда партнер онлайн */}
            {layout === 'spotlight' && partnerOnline && (
              <div className="absolute bottom-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded">
                Фокус на партнере
              </div>
            )}
            {/* Индикатор ожидания партнера - показываем только в режимах grid и side-by-side */}
            {!partnerOnline &&
              layout !== 'spotlight' &&
              (layout === 'grid' || layout === 'side-by-side') && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center text-white">
                    <Users size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Ожидание подключения партнера...</p>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Элементы управления */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <VideoControls
          localStream={localStream}
          isVideoActive={isVideoActive}
          isAudioActive={isAudioActive}
          isScreenSharing={isScreenSharing}
          onToggleVideo={onToggleVideo}
          onToggleAudio={onToggleAudio}
          onToggleScreenShare={onToggleScreenShare}
          onDeviceChange={onDeviceChange}
          onSettingsChange={onSettingsChange}
          onFullscreen={handleFullscreen}
          isFullscreen={isFullscreen}
        />
      </div>

      {/* Кнопки переключения layout */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
          <Button
            variant={layout === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onLayoutChange('grid')}
            className="h-8 w-8 p-0"
            title="Сетка"
          >
            <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
            </div>
          </Button>
          <Button
            variant={layout === 'spotlight' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onLayoutChange('spotlight')}
            className="h-8 w-8 p-0"
            title="Фокус"
          >
            <User size={14} />
          </Button>
          <Button
            variant={layout === 'side-by-side' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onLayoutChange('side-by-side')}
            className="h-8 w-8 p-0"
            title="Рядом"
          >
            <div className="w-3 h-3 flex gap-0.5">
              <div className="bg-current rounded-sm flex-1"></div>
              <div className="bg-current rounded-sm flex-1"></div>
            </div>
          </Button>
        </div>
      </div>

      {/* Индикатор режима spotlight */}
      {layout === 'spotlight' && (
        <div className="absolute bottom-32 left-4 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <User size={12} />
          {partnerOnline ? 'Фокус на партнере' : 'Фокус на вас'}
        </div>
      )}

      {/* Индикатор показа экрана */}
      {isScreenSharing && (
        <div
          className={`absolute z-10 bg-orange-500 text-white text-xs px-2 py-1 rounded ${
            layout === 'spotlight' ? 'bottom-32 left-32' : 'bottom-32 left-4'
          }`}
        >
          Показ экрана активен
        </div>
      )}
    </div>
  );
}
