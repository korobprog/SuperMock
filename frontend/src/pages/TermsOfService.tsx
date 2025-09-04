import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { navigateToExternal, handleExternalClick } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { ArrowRight, FileText, CheckCircle, AlertTriangle, Clock, Users, Shield, CreditCard } from "lucide-react";
import Logo from "@/components/Logo";

const TermsOfService = () => {
  const sections = [
    {
      title: "Принятие условий",
      icon: <CheckCircle className="h-6 w-6" />,
      content: [
        "Используя сервис SuperMock, вы соглашаетесь с настоящими условиями использования",
        "Условия применяются ко всем пользователям платформы",
        "Мы оставляем право изменять условия с уведомлением пользователей"
      ]
    },
    {
      title: "Описание сервиса",
      icon: <FileText className="h-6 w-6" />,
      content: [
        "SuperMock — AI-платформа для подготовки к техническим собеседованиям",
        "Предоставляет моковые собеседования с ИИ-помощником",
        "Поддерживает 6 языков программирования",
        "Включает персонализированные рекомендации и аналитику"
      ]
    },
    {
      title: "Регистрация и аккаунт",
      icon: <Users className="h-6 w-6" />,
      content: [
        "Для использования сервиса требуется регистрация",
        "Вы несете ответственность за сохранность учетных данных",
        "Один аккаунт на одного пользователя",
        "Запрещена передача аккаунта третьим лицам"
      ]
    },
    {
      title: "Платежи и подписки",
      icon: <CreditCard className="h-6 w-6" />,
      content: [
        "Платежи обрабатываются через IO Money и Payeer",
        "Подписки автоматически НЕ продлеваются",
        
        "Возврат средств согласно политике провайдеров"
      ]
    },
    {
      title: "Ограничения использования",
      icon: <AlertTriangle className="h-6 w-6" />,
      content: [
        "Запрещено использование для незаконных целей",
        "Нельзя передавать доступ третьим лицам",
        "Запрещено нарушение работы сервиса",
        "Нельзя использовать для создания конкурирующих сервисов"
      ]
    },
    {
      title: "Интеллектуальная собственность",
      icon: <Shield className="h-6 w-6" />,
      content: [
        "Весь контент платформы защищен авторским правом",
        "Пользователи получают лицензию на использование",
        "Запрещено копирование и распространение контента",
        "Исключительные права принадлежат SuperMock"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="container mx-auto text-center">
          <div className="flex flex-col items-center space-y-4 mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Условия <span className="gradient-primary bg-clip-text text-transparent">использования</span>
              </h1>
              <Badge variant="secondary" className="bg-neon-green/20 text-neon-green border-neon-green/30 text-sm px-3 py-1">
                Terms of Service
              </Badge>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            📋 Правила использования платформы SuperMock
          </p>
          
          {/* Update Notice */}
          <div className="max-w-4xl mx-auto">
            <Card className="neu-card border-0 bg-gradient-to-r from-primary/5 to-secondary/5 mb-8">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      Дата вступления в силу: 01.09.2025
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Настоящие Условия использования регулируют порядок использования сервиса SuperMock 
                      и устанавливают права и обязанности сторон.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Terms Sections */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {sections.map((section, index) => (
              <Card key={index} className="neu-card border-0 hover:glow-primary transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      {section.icon}
                    </div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-neon-green mt-2 flex-shrink-0"></div>
                        <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Sections */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="neu-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Clock className="h-6 w-6" />
                  <span>Срок действия</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Настоящие условия действуют бессрочно с момента их принятия пользователем. 
                  Изменения вступают в силу с момента их публикации на сайте.
                </p>
              </CardContent>
            </Card>
            
            <Card className="neu-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6" />
                  <span>Ответственность</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  SuperMock не несет ответственности за результаты собеседований пользователей. 
                  Сервис предоставляет только инструменты для подготовки.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Legal Notice */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <Card className="neu-card border-0 max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-green/20 to-primary/20 flex items-center justify-center mx-auto">
                  <span className="text-3xl">⚖️</span>
                </div>
                <h2 className="text-2xl font-bold">
                  Юридическая <span className="gradient-accent bg-clip-text text-transparent">информация</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Настоящие условия использования регулируются законодательством Российской Федерации. 
                  Все споры разрешаются в соответствии с действующим законодательством.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" size="lg">
                    <FileText className="mr-2 h-5 w-5" />
                    Условия использования
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => window.location.href = '/privacy-policy'}>
                    <Shield className="mr-2 h-5 w-5" />
                    Политика конфиденциальности
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto text-center">
          <Card className="neu-card border-0 max-w-4xl mx-auto">
            <CardContent className="p-12">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold">
                  Готовы <span className="gradient-accent bg-clip-text text-transparent">начать</span> обучение?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Принимая условия использования, вы можете начать подготовку к собеседованию
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="animate-pulse-glow"
                    onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
                  >
                    Начать обучение
                  </Button>
                  <Button variant="outline" size="xl" onClick={() => window.location.href = '/'}>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Вернуться на главную
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsOfService;
