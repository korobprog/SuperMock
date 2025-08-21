import React, { useState, useEffect } from 'react';
import { X, Info, Clock, Users, Lightbulb, CheckCircle } from 'lucide-react';
import { Button } from './button';

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

const candidateSlides: InfoSlide[] = [
  {
    icon: <Clock size={24} />,
    title: 'Выберите удобное время',
    description:
      'Доступны слоты 24 часа в сутки. Система автоматически скрывает прошедшее время.',
    color: 'text-blue-600',
  },
  {
    icon: <Users size={24} />,
    title: 'Найдите int.',
    description:
      'Видите количество доступных int. в каждом временном слоте.',
    color: 'text-green-600',
  },
  {
    icon: <Lightbulb size={24} />,
    title: 'Умные рекомендации',
    description: 'Система рекомендует оптимальное время для быстрого матчинга.',
    color: 'text-yellow-600',
  },
  {
    icon: <CheckCircle size={24} />,
    title: 'Быстрый старт',
    description:
      'Один клик - и вы в очереди на интервью. Автоматический матчинг!',
    color: 'text-purple-600',
  },
];

const interviewerSlides: InfoSlide[] = [
  {
    icon: <Clock size={24} />,
    title: 'Гибкий график',
    description: 'Выбирайте время, когда вам удобно проводить интервью.',
    color: 'text-blue-600',
  },
  {
    icon: <Users size={24} />,
    title: 'Кандидаты ждут',
    description:
      'Видите количество кандидатов, готовых к интервью в каждом слоте.',
    color: 'text-green-600',
  },
  {
    icon: <Lightbulb size={24} />,
    title: 'Оптимальное время',
    description: 'Система показывает, когда больше всего кандидатов.',
    color: 'text-yellow-600',
  },
  {
    icon: <CheckCircle size={24} />,
    title: 'Эффективность',
    description: 'Максимальная загрузка и минимальное время ожидания.',
    color: 'text-purple-600',
  },
];

export function InfoCarousel({ isOpen, onClose, mode }: InfoCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

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
                {mode === 'candidate' ? 'Кандидатам' : 'int.'}
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
              Назад
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
              Далее
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
