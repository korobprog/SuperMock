import React, { useState, useEffect } from 'react';
import { X, Info, Key, Brain, Zap, Globe, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { useAppTranslation } from '@/lib/i18n';

interface InfoSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface OpenRouterInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}



export function OpenRouterInfoModal({ isOpen, onClose }: OpenRouterInfoModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const { t } = useAppTranslation();

  // Создаем слайды с переводами
  const slides: InfoSlide[] = [
    {
      icon: <Brain size={24} />,
      title: t('openRouterModal.slides.slide1.title'),
      description: t('openRouterModal.slides.slide1.description'),
      color: 'text-blue-600',
    },
    {
      icon: <Zap size={24} />,
      title: t('openRouterModal.slides.slide2.title'),
      description: t('openRouterModal.slides.slide2.description'),
      color: 'text-green-600',
    },
    {
      icon: <Key size={24} />,
      title: t('openRouterModal.slides.slide3.title'),
      description: t('openRouterModal.slides.slide3.description'),
      color: 'text-purple-600',
    },
    {
      icon: <Globe size={24} />,
      title: t('openRouterModal.slides.slide4.title'),
      description: t('openRouterModal.slides.slide4.description'),
      color: 'text-orange-600',
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      setTextVisible(false);

      // Показываем текст с задержкой
      const textTimer = setTimeout(() => {
        setTextVisible(true);
      }, 300);

      return () => clearTimeout(textTimer);
    } else {
      setTextVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTextVisible(false);

      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setTextVisible(true);
      }, 200);
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleNext = () => {
    setTextVisible(false);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setTextVisible(true);
    }, 200);
  };

  const handlePrev = () => {
    setTextVisible(false);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setTextVisible(true);
    }, 200);
  };

  const handleDotClick = (index: number) => {
    setTextVisible(false);
    setTimeout(() => {
      setCurrentSlide(index);
      setTextVisible(true);
    }, 200);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
          <DialogHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Info size={20} className="mr-2" />
                <DialogTitle className="text-lg font-semibold">
                  {t('openRouterModal.title')}
                </DialogTitle>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1 border-none bg-transparent outline-none focus:outline-none focus:ring-0 focus:border-none"
                style={{ border: 'none', background: 'transparent' }}
              >
                <X size={20} />
              </button>
            </div>
            <DialogDescription className="text-white/90">
              {t('openRouterModal.subtitle')}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 ${currentSlideData.color}`}
            >
              {currentSlideData.icon}
            </div>

            <h3 className={`text-xl font-bold mb-3 ${currentSlideData.color}`}>
              {currentSlideData.title}
            </h3>

            <p
              className={`text-gray-600 leading-relaxed transition-all duration-500 ${
                textVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
            >
              {currentSlideData.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2 mb-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-blue-500 w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1"
            >
              <ArrowLeft size={16} className="mr-2" />
              {t('openRouterModal.back')}
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              {t('openRouterModal.next')}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                {t('openRouterModal.gotIt')}
              </Button>
              <Button
                onClick={() => {
                  window.open('https://openrouter.ai/keys', '_blank');
                  onClose();
                }}
                className="flex-1"
              >
                {t('openRouterModal.getApiKey')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
