import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { navigateToExternal, handleExternalClick } from "@/lib/utils";
import { 
  Code, 
  Video, 
  MessageSquare, 
  Brain,
  ArrowRight,
  ExternalLink,
  FileText,
  Play,
} from "lucide-react";
import Footer from "@/components/Footer";

const Documentation = () => {
  const sections = [
    {
      title: "Начало работы",
      description: "Быстрый старт с платформой Super Mock",
      icon: Play,
      color: "gradient-primary",
      items: [
        "Регистрация и настройка профиля",
        "Выбор языка и профессии",
        "Первое моковое собеседование",
        "Настройка предпочтений"
      ]
    },
    {
      title: "API Документация",
      description: "Интеграция с платформой через API",
      icon: Code,
      color: "gradient-secondary",
      items: [
        "Аутентификация и авторизация",
        "Эндпоинты для собеседований",
        "Webhook интеграции",
        "Примеры использования"
      ]
    },
    {
      title: "WebRTC Настройки",
      description: "Конфигурация видеозвонков",
      icon: Video,
      color: "gradient-accent",
      items: [
        "Настройка камеры и микрофона",
        "TURN/STUN серверы",
        "Качество соединения",
        "Устранение проблем"
      ]
    },
    {
      title: "AI Функции",
      description: "Использование искусственного интеллекта",
      icon: Brain,
      color: "gradient-primary",
      items: [
        "Анализ ответов кандидатов",
        "Персонализированные рекомендации",
        "Автоматическая оценка навыков",
        "Планирование обучения"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            <span className="gradient-primary bg-clip-text text-transparent">Документация</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Подробные руководства по использованию платформы Super Mock
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="lg"
              onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
            >
              <Play className="mr-2 h-5 w-5" />
              Открыть приложение
            </Button>
            <Button variant="outline" size="lg">
              <FileText className="mr-2 h-5 w-5" />
              Скачать PDF
            </Button>
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Разделы <span className="gradient-accent bg-clip-text text-transparent">документации</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Выберите интересующий вас раздел для подробного изучения
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index} className="neu-card border-0 hover:glow-primary transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-2xl ${section.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <CardDescription className="text-base">{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-neon-green mt-2 flex-shrink-0"></div>
                          <span className="text-sm leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-6">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Подробнее
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto text-center">
          <Card className="neu-card border-0 max-w-4xl mx-auto">
            <CardContent className="p-12">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold">
                  Нужна <span className="gradient-accent bg-clip-text text-transparent">помощь</span>?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Если у вас есть вопросы, обратитесь к нашей команде поддержки
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="wave-shimmer"
                    onClick={() => window.location.href = '/support'}
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Связаться с поддержкой
                  </Button>
                  <Button variant="outline" size="xl" onClick={() => window.location.href = '/faq'}>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    FAQ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
    <Footer />
    </div>
  );
};

export default Documentation;
