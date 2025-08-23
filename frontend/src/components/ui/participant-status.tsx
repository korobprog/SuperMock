import { useState, useEffect } from 'react';
import { User, Circle, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Participant {
  id: string;
  name: string;
  role: string;
  isOnline: boolean;
  lastSeen?: Date;
  isTyping?: boolean;
}

interface ParticipantStatusProps {
  participants: Participant[];
  currentUserId: string;
}

export function ParticipantStatus({ participants, currentUserId }: ParticipantStatusProps) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const online = participants.filter(p => p.isOnline).length;
    setOnlineCount(online);
  }, [participants]);

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'text-green-500' : 'text-gray-400';
  };

  const getStatusText = (participant: Participant) => {
    if (participant.isTyping) return 'печатает...';
    if (participant.isOnline) return 'онлайн';
    if (participant.lastSeen) {
      const now = new Date();
      const diff = now.getTime() - participant.lastSeen.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      if (minutes < 1) return 'только что';
      if (minutes < 60) return `${minutes} мин назад`;
      const hours = Math.floor(minutes / 60);
      return `${hours} ч назад`;
    }
    return 'не в сети';
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-1">
        <Wifi size={14} className="text-green-500" />
        <span className="text-xs text-muted-foreground">
          {onlineCount}/{participants.length} онлайн
        </span>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2">
        {participants.map((participant) => (
          <div key={participant.id} className="flex items-center gap-1">
            <div className="relative">
              <User size={16} className={getStatusColor(participant.isOnline)} />
              <Circle 
                size={6} 
                className={`absolute -bottom-1 -right-1 ${getStatusColor(participant.isOnline)}`}
                fill={participant.isOnline ? 'currentColor' : 'none'}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">
                {participant.name}
                {participant.id === currentUserId && ' (Вы)'}
              </span>
              <span className="text-xs text-muted-foreground">
                {getStatusText(participant)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
