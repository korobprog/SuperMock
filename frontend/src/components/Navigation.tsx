import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { navigateToExternal, handleExternalClick } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const Navigation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    { path: "/features", label: t('navigation.features') },
    { path: "/learning-process", label: t('navigation.learningProcess') },
    { path: "/professions", label: t('navigation.professions') },
    { path: "/languages", label: t('navigation.languages') },
    { path: "/pricing", label: t('navigation.pricing') },
    { path: "/instructions", label: t('navigation.instructions') },
    { path: "/support", label: t('navigation.support') },
    { path: "/about", label: t('navigation.about') },

  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Mobile Language Switcher */}
          <div className="flex items-center gap-4">
            <Link to="/" onClick={closeMobileMenu}>
              <Logo />
            </Link>
            {/* Mobile Language Switcher - visible only on mobile */}
            <div className="lg:hidden">
              <LanguageSwitcher compact />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-colors ${
                  isActive(item.path)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right Section */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="outline" onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}>
              {t('navigation.login')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 neu-card-no-hover border-t border-border/50">
            <div className="container mx-auto px-6 py-4 space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`block py-2 transition-colors ${
                    isActive(item.path)
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-border/50 space-y-4">
                <Button onClick={(e) => handleExternalClick('https://app.supermock.ru', e)} variant="outline" className="w-full">
                  {t('navigation.login')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
