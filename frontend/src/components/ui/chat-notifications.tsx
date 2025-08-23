import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatNotificationProps {
  message: string;
  onClose: () => void;
  autoHide?: boolean;
  duration?: number;
}

export function ChatNotification({ 
  message, 
  onClose, 
  autoHide = true, 
  duration = 5000 
}: ChatNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Ждем анимацию исчезновения
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-blue-500 text-white p-3 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center gap-2">
          <Bell size={16} className="flex-shrink-0" />
          <span className="text-sm flex-1">{message}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="h-6 w-6 p-0 text-white hover:bg-blue-600"
          >
            <X size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
