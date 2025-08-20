import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Settings,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  RotateCcw,
  Maximize,
  Minimize,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface VideoControlsProps {
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
  onFullscreen: () => void;
  isFullscreen: boolean;
}

interface Device {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export function VideoControls({
  localStream,
  isVideoActive,
  isAudioActive,
  isScreenSharing,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onDeviceChange,
  onSettingsChange,
  onFullscreen,
  isFullscreen,
}: VideoControlsProps) {
  const [devices, setDevices] = useState<{
    video: Device[];
    audio: Device[];
  }>({ video: [], audio: [] });
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>(
    'medium'
  );
  const [audioQuality, setAudioQuality] = useState<'low' | 'medium' | 'high'>(
    'medium'
  );
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // Загружаем доступные устройства
  useEffect(() => {
    async function loadDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter((device) => device.kind === 'videoinput')
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Камера ${device.deviceId.slice(0, 8)}`,
            kind: device.kind,
          }));
        const audioDevices = devices
          .filter((device) => device.kind === 'audioinput')
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Микрофон ${device.deviceId.slice(0, 8)}`,
            kind: device.kind,
          }));

        setDevices({ video: videoDevices, audio: audioDevices });

        // Устанавливаем первые устройства по умолчанию
        if (videoDevices.length > 0 && !selectedVideoDevice) {
          setSelectedVideoDevice(videoDevices[0].deviceId);
        }
        if (audioDevices.length > 0 && !selectedAudioDevice) {
          setSelectedAudioDevice(audioDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error loading devices:', error);
      }
    }

    loadDevices();

    // Слушаем изменения устройств
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, [selectedVideoDevice, selectedAudioDevice]);

  // Обработчики изменения устройств
  const handleVideoDeviceChange = (deviceId: string) => {
    setSelectedVideoDevice(deviceId);
    onDeviceChange(deviceId, 'video');
  };

  const handleAudioDeviceChange = (deviceId: string) => {
    setSelectedAudioDevice(deviceId);
    onDeviceChange(deviceId, 'audio');
  };

  // Обработчики настроек качества
  const handleVideoQualityChange = (quality: 'low' | 'medium' | 'high') => {
    setVideoQuality(quality);
    onSettingsChange({ videoQuality: quality, audioQuality });
  };

  const handleAudioQualityChange = (quality: 'low' | 'medium' | 'high') => {
    setAudioQuality(quality);
    onSettingsChange({ videoQuality, audioQuality: quality });
  };

  // Обработчики мута
  const handleToggleAudioMute = () => {
    setIsAudioMuted(!isAudioMuted);
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isAudioMuted;
      });
    }
  };

  const handleToggleVideoMute = () => {
    setIsVideoMuted(!isVideoMuted);
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isVideoMuted;
      });
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 p-4 bg-black/80 backdrop-blur-sm rounded-lg">
      {/* Кнопка микрофона */}
      <Button
        variant={isAudioActive ? 'default' : 'destructive'}
        size="sm"
        onClick={onToggleAudio}
        className="h-10 w-10 p-0"
        title={isAudioActive ? 'Выключить микрофон' : 'Включить микрофон'}
      >
        {isAudioActive ? <Mic size={16} /> : <MicOff size={16} />}
      </Button>

      {/* Кнопка мута микрофона */}
      <Button
        variant={isAudioMuted ? 'destructive' : 'outline'}
        size="sm"
        onClick={handleToggleAudioMute}
        className="h-10 w-10 p-0"
        title={isAudioMuted ? 'Включить звук' : 'Выключить звук'}
        disabled={!isAudioActive}
      >
        {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </Button>

      {/* Кнопка камеры */}
      <Button
        variant={isVideoActive ? 'default' : 'destructive'}
        size="sm"
        onClick={onToggleVideo}
        className="h-10 w-10 p-0"
        title={isVideoActive ? 'Выключить камеру' : 'Включить камеру'}
      >
        {isVideoActive ? <Video size={16} /> : <VideoOff size={16} />}
      </Button>

      {/* Кнопка мута камеры */}
      <Button
        variant={isVideoMuted ? 'destructive' : 'outline'}
        size="sm"
        onClick={handleToggleVideoMute}
        className="h-10 w-10 p-0"
        title={isVideoMuted ? 'Включить видео' : 'Выключить видео'}
        disabled={!isVideoActive}
      >
        {isVideoMuted ? <CameraOff size={16} /> : <Camera size={16} />}
      </Button>

      {/* Кнопка показа экрана */}
      <Button
        variant={isScreenSharing ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleScreenShare}
        className="h-10 w-10 p-0"
        title={isScreenSharing ? 'Остановить показ экрана' : 'Показать экран'}
      >
        {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
      </Button>

      {/* Кнопка полноэкранного режима */}
      <Button
        variant="outline"
        size="sm"
        onClick={onFullscreen}
        className="h-10 w-10 p-0"
        title={
          isFullscreen
            ? 'Выйти из полноэкранного режима'
            : 'Полноэкранный режим'
        }
      >
        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
      </Button>

      {/* Настройки */}
      <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0"
            title="Настройки видео"
          >
            <Settings size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="center">
          <div className="space-y-4">
            <h4 className="font-medium">Настройки видео</h4>

            {/* Выбор камеры */}
            <div className="space-y-2">
              <Label>Камера</Label>
              <Select
                value={selectedVideoDevice}
                onValueChange={handleVideoDeviceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите камеру" />
                </SelectTrigger>
                <SelectContent>
                  {devices.video
                    .filter((device) => device.deviceId && device.deviceId.trim() !== '')
                    .map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Камера ${device.deviceId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Выбор микрофона */}
            <div className="space-y-2">
              <Label>Микрофон</Label>
              <Select
                value={selectedAudioDevice}
                onValueChange={handleAudioDeviceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите микрофон" />
                </SelectTrigger>
                <SelectContent>
                  {devices.audio
                    .filter((device) => device.deviceId && device.deviceId.trim() !== '')
                    .map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Микрофон ${device.deviceId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Качество видео */}
            <div className="space-y-2">
              <Label>Качество видео</Label>
              <Select
                value={videoQuality}
                onValueChange={handleVideoQualityChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкое (360p)</SelectItem>
                  <SelectItem value="medium">Среднее (720p)</SelectItem>
                  <SelectItem value="high">Высокое (1080p)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Качество аудио */}
            <div className="space-y-2">
              <Label>Качество аудио</Label>
              <Select
                value={audioQuality}
                onValueChange={handleAudioQualityChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкое (8kHz)</SelectItem>
                  <SelectItem value="medium">Среднее (16kHz)</SelectItem>
                  <SelectItem value="high">Высокое (48kHz)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Дополнительные настройки */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Автофокус</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Шумоподавление</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Эхоподавление</Label>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
