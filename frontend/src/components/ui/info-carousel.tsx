import React, { useState, useEffect } from 'react';
import { X, Info, Clock, Users, Lightbulb, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { useAppTranslation } from '@/lib/i18n';

interface InfoSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface InfoCarouselProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'candidate' | 'interviewer';
}



export function InfoCarousel({ isOpen, onClose, mode }: InfoCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const { t } = useAppTranslation();

  // Создаем слайды с переводами
  const candidateSlides: InfoSlide[] = [
    {
      icon: <Clock size={24} />,
      title: t('infoCarousel.candidateSlides.slide1.title'),
      description: t('infoCarousel.candidateSlides.slide1.description'),
      color: 'text-blue-600',
    },
    {
      icon: <Users size={24} />,
      title: t('infoCarousel.candidateSlides.slide2.title'),
      description: t('infoCarousel.candidateSlides.slide2.description'),
      color: 'text-green-600',
    },
    {
      icon: <Lightbulb size={24} />,
      title: t('infoCarousel.candidateSlides.slide3.title'),
      description: t('infoCarousel.candidateSlides.slide3.description'),
      color: 'text-yellow-600',
    },
    {
      icon: <CheckCircle size={24} />,
      title: t('infoCarousel.candidateSlides.slide4.title'),
      description: t('infoCarousel.candidateSlides.slide4.description'),
      color: 'text-purple-600',
    },
  ];

  const interviewerSlides: InfoSlide[] = [
    {
      icon: <Clock size={24} />,
      title: t('infoCarousel.interviewerSlides.slide1.title'),
      description: t('infoCarousel.interviewerSlides.slide1.description'),
      color: 'text-blue-600',
    },
    {
      icon: <Users size={24} />,
      title: t('infoCarousel.interviewerSlides.slide2.title'),
      description: t('infoCarousel.interviewerSlides.slide2.description'),
      color: 'text-green-600',
    },
    {
      icon: <Lightbulb size={24} />,
      title: t('infoCarousel.interviewerSlides.slide3.title'),
      description: t('infoCarousel.interviewerSlides.slide3.description'),
      color: 'text-yellow-600',
    },
    {
      icon: <CheckCircle size={24} />,
      title: t('infoCarousel.interviewerSlides.slide4.title'),
      description: t('infoCarousel.interviewerSlides.slide4.description'),
      color: 'text-purple-600',
    },
  ];

  const slides = mode === 'candidate' ? candidateSlides : interviewerSlides;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentSlide(0);
      setTextVisible(false);

      // Показываем текст с задержкой
      const textTimer = setTimeout(() => {
        setTextVisible(true);
      }, 300);

      return () => clearTimeout(textTimer);
    } else {
      setIsVisible(false);
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
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, slides.length]);

  if (!isVisible) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Info size={20} className="mr-2" />
              <h2 className="text-lg font-semibold">
                {mode === 'candidate' ? t('infoCarousel.candidateTitle') : t('infoCarousel.interviewerTitle')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
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
          <div className="flex justify-center space-x-2 mb-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setTextVisible(false);
                  setTimeout(() => {
                    setCurrentSlide(index);
                    setTextVisible(true);
                  }, 200);
                }}
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
              onClick={() => {
                setTextVisible(false);
                setTimeout(() => {
                  setCurrentSlide(
                    (prev) => (prev - 1 + slides.length) % slides.length
                  );
                  setTextVisible(true);
                }, 200);
              }}
              className="flex-1"
            >
              {t('infoCarousel.back')}
            </Button>
            <Button
              onClick={() => {
                setTextVisible(false);
                setTimeout(() => {
                  setCurrentSlide((prev) => (prev + 1) % slides.length);
                  setTextVisible(true);
                }, 200);
              }}
              className="flex-1"
            >
              {t('infoCarousel.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
