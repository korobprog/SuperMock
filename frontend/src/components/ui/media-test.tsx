import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  CheckCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface MediaDevices {
  videoInputs: MediaDeviceInfo[];
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
}

interface MediaSettings {
  videoDeviceId: string;
  audioDeviceId: string;
  audioOutputDeviceId: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  volume: number;
}

export function MediaTest() {
  const { t } = useTranslation();
  const { mediaSettings, setMediaSettings } = useAppStore();
  
  const [devices, setDevices] = useState<MediaDevices>({
    videoInputs: [],
    audioInputs: [],
    audioOutputs: [],
  });
  
  const [currentSettings, setCurrentSettings] = useState<MediaSettings>({
    videoDeviceId: mediaSettings?.videoDeviceId || '',
    audioDeviceId: mediaSettings?.audioDeviceId || '',
    audioOutputDeviceId: mediaSettings?.audioOutputDeviceId || '',
    videoEnabled: mediaSettings?.videoEnabled ?? true,
    audioEnabled: mediaSettings?.audioEnabled ?? true,
    volume: mediaSettings?.volume ?? 100,
  });
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTestMode, setIsTestMode] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Загружаем доступные устройства
  useEffect(() => {
    loadDevices();
    
    // Слушаем изменения устройств
    const handleDeviceChange = () => {
      console.log('Devices changed, reloading...');
      loadDevices();
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  // Обрабатываем изменения в настройках
  useEffect(() => {
    if (currentSettings.videoEnabled || currentSettings.audioEnabled) {
      startStream();
    } else {
      stopStream();
    }
  }, [currentSettings.videoDeviceId, currentSettings.audioDeviceId, currentSettings.videoEnabled, currentSettings.audioEnabled]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      stopStream();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Запрашиваем разрешения с fallback
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (permissionError) {
        console.log('Permission denied, trying video only:', permissionError);
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (videoError) {
          console.log('Video permission denied, trying audio only:', videoError);
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (audioError) {
            console.log('All permissions denied:', audioError);
            // Продолжаем без разрешений, возможно устройства будут доступны позже
          }
        }
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      
      setDevices({
        videoInputs,
        audioInputs,
        audioOutputs,
      });
      
      // Проверяем, доступны ли сохраненные устройства
      const hasVideoDevice = videoInputs.some(d => d.deviceId === currentSettings.videoDeviceId);
      const hasAudioDevice = audioInputs.some(d => d.deviceId === currentSettings.audioDeviceId);
      
      // Устанавливаем первые доступные устройства по умолчанию или если сохраненные недоступны
      if ((!currentSettings.videoDeviceId || !hasVideoDevice) && videoInputs.length > 0) {
        setCurrentSettings(prev => ({
          ...prev,
          videoDeviceId: videoInputs[0].deviceId,
        }));
      }
      
      if ((!currentSettings.audioDeviceId || !hasAudioDevice) && audioInputs.length > 0) {
        setCurrentSettings(prev => ({
          ...prev,
          audioDeviceId: audioInputs[0].deviceId,
        }));
      }
      
      // Если нет устройств, показываем предупреждение
      if (videoInputs.length === 0 && audioInputs.length === 0) {
        setError(t('media.errors.noDevices'));
      }
      
    } catch (err) {
      console.error('Error loading devices:', err);
              setError(t('media.errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const startStream = async () => {
    try {
      stopStream();
      
      // Сначала пробуем с выбранными устройствами
      let constraints: MediaStreamConstraints = {
        video: currentSettings.videoEnabled ? {
          deviceId: currentSettings.videoDeviceId ? { exact: currentSettings.videoDeviceId } : undefined,
        } : false,
        audio: currentSettings.audioEnabled ? {
          deviceId: currentSettings.audioDeviceId ? { exact: currentSettings.audioDeviceId } : undefined,
        } : false,
      };

      let newStream: MediaStream;

      try {
        // Пробуем с точными устройствами
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (exactError) {
        console.log('Exact device constraint failed, trying fallback:', exactError);
        
        // Если не получилось, пробуем без точного указания устройств
        constraints = {
          video: currentSettings.videoEnabled,
          audio: currentSettings.audioEnabled,
        };

        try {
          newStream = await navigator.mediaDevices.getUserMedia(constraints);
          
          // Обновляем настройки на фактически используемые устройства
          const tracks = newStream.getTracks();
          const videoTrack = tracks.find(track => track.kind === 'video');
          const audioTrack = tracks.find(track => track.kind === 'audio');
          
          if (videoTrack && currentSettings.videoEnabled) {
            const videoSettings = videoTrack.getSettings();
            if (videoSettings.deviceId) {
              setCurrentSettings(prev => ({
                ...prev,
                videoDeviceId: videoSettings.deviceId as string,
              }));
            }
          }
          
          if (audioTrack && currentSettings.audioEnabled) {
            const audioSettings = audioTrack.getSettings();
            if (audioSettings.deviceId) {
              setCurrentSettings(prev => ({
                ...prev,
                audioDeviceId: audioSettings.deviceId as string,
              }));
            }
          }
          
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          throw fallbackError;
        }
      }

      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      // Настраиваем анализ аудио для индикатора уровня
      if (currentSettings.audioEnabled && newStream.getAudioTracks().length > 0) {
        setupAudioAnalysis(newStream);
      }

    } catch (err) {
      console.error('Error starting stream:', err);
      
      if (err instanceof OverconstrainedError) {
                  setError(t('media.errors.deviceUnavailable', { constraint: err.constraint }));
      } else {
                  setError(t('media.errors.streamFailed'));
      }
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setAudioLevel(0);
  };

  const setupAudioAnalysis = (audioStream: MediaStream) => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      audioContextRef.current = new AudioContext();
      const audioContext = audioContextRef.current;
      
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      microphoneRef.current = audioContext.createMediaStreamSource(audioStream);
      microphoneRef.current.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel(average);
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (err) {
      console.error('Error setting up audio analysis:', err);
    }
  };

  const handleDeviceChange = (type: keyof MediaSettings, value: string | boolean) => {
    setCurrentSettings(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleSaveSettings = () => {
    setMediaSettings(currentSettings);
    setIsTestMode(false);
  };

  const handleTestAudio = () => {
    setIsTestMode(!isTestMode);
  };

  const getDeviceName = (device: MediaDeviceInfo) => {
    return device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`;
  };

  const getAudioLevelColor = (level: number) => {
    if (level < 30) return 'bg-red-500';
    if (level < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings size={20} className="text-blue-600" />
            {t('media.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('media.subtitle')}
          </p>
        </div>
        <Button
          onClick={loadDevices}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-1 sm:gap-2"
        >
          <RefreshCw size={14} className={`${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t('media.refresh')}</span>
        </Button>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Видео */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video size={18} className="text-blue-600" />
              {t('media.camera.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Видео превью */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              {currentSettings.videoEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <VideoOff size={48} className="text-gray-400" />
                </div>
              )}
              
              {/* Индикатор состояния */}
              <div className="absolute top-2 right-2">
                <Badge variant={currentSettings.videoEnabled ? 'default' : 'secondary'}>
                  {currentSettings.videoEnabled ? (
                    <CheckCircle size={12} className="mr-1" />
                  ) : (
                    <VideoOff size={12} className="mr-1" />
                  )}
                  {currentSettings.videoEnabled ? t('media.camera.enabled') : t('media.camera.disabled')}
                </Badge>
              </div>
            </div>

            {/* Переключатель */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('media.camera.enable')}</span>
              <Button
                variant={currentSettings.videoEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDeviceChange('videoEnabled', !currentSettings.videoEnabled)}
              >
                {currentSettings.videoEnabled ? t('media.camera.enabled') : t('media.camera.disabled')}
              </Button>
            </div>

            {/* Выбор устройства */}
            {devices.videoInputs.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('media.camera.selectDevice')}</label>
                <select
                  value={currentSettings.videoDeviceId}
                  onChange={(e) => handleDeviceChange('videoDeviceId', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background"
                >
                  {devices.videoInputs.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {getDeviceName(device)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Аудио */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic size={18} className="text-green-600" />
              {t('media.microphone.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Индикатор уровня звука */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('media.microphone.level')}</span>
                <Badge variant={currentSettings.audioEnabled ? 'default' : 'secondary'}>
                  {currentSettings.audioEnabled ? (
                    <Mic size={12} className="mr-1" />
                  ) : (
                    <MicOff size={12} className="mr-1" />
                  )}
                  {currentSettings.audioEnabled ? t('media.microphone.enabled') : t('media.microphone.disabled')}
                </Badge>
              </div>
              
              <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${getAudioLevelColor(audioLevel)}`}
                  style={{ width: `${(audioLevel / 255) * 100}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Переключатель */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('media.microphone.enable')}</span>
              <Button
                variant={currentSettings.audioEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDeviceChange('audioEnabled', !currentSettings.audioEnabled)}
              >
                {currentSettings.audioEnabled ? t('media.microphone.enabled') : t('media.microphone.disabled')}
              </Button>
            </div>

            {/* Выбор устройства */}
            {devices.audioInputs.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('media.microphone.selectDevice')}</label>
                <select
                  value={currentSettings.audioDeviceId}
                  onChange={(e) => handleDeviceChange('audioDeviceId', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background"
                >
                  {devices.audioInputs.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {getDeviceName(device)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Громкость */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('media.volume.title')}</span>
                <span className="text-sm text-muted-foreground">{currentSettings.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentSettings.volume}
                onChange={(e) => handleDeviceChange('volume', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Кнопки действий */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleSaveSettings}
          className="flex-1"
          disabled={isLoading}
          size="sm"
        >
          <CheckCircle size={16} className="mr-2" />
          {t('media.actions.saveSettings')}
        </Button>
        
        <Button
          onClick={handleTestAudio}
          variant="outline"
          disabled={!currentSettings.audioEnabled}
          size="sm"
          className="flex items-center gap-2"
        >
          {isTestMode ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <span className="hidden sm:inline">
            {isTestMode ? t('media.actions.stopTest') : t('media.actions.testAudio')}
          </span>
        </Button>
      </div>

      {/* Информация о сохраненных настройках */}
      {mediaSettings && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t('media.status.saved')}
          </p>
        </div>
      )}
    </div>
  );
}
