import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronDown, Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  compact?: boolean;
}

const LanguageSwitcher = ({ compact = false }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 h-auto ${
          compact ? 'px-2 py-1 h-8' : ''
        }`}
      >
        {!compact && <Globe className="h-4 w-4" />}
        <span className={`${compact ? 'text-base' : 'text-lg'}`}>{currentLanguage.flag}</span>
        {!compact && (
          <span className="hidden sm:inline text-sm font-medium">
            {currentLanguage.code.toUpperCase()}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="py-2">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3 ${
                  i18n.language === language.code ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                <span className="text-xl">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {i18n.language === language.code && (
                  <div className="ml-auto w-2 h-2 bg-primary rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;

