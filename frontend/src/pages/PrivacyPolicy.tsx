import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { navigateToExternal, handleExternalClick } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { ArrowRight, Shield, Lock, Eye, Users, CreditCard, Mail, MessageCircle } from "lucide-react";
import Logo from "@/components/Logo";

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "Собираемые данные",
      icon: <Eye className="h-6 w-6" />,
      content: [
        "Контактные данные (e-mail)",
        "Регистрационные данные (логин, пароль, идентификатор пользователя)",
        "Платёжная информация (через сторонних операторов IO Money, Payeer)",
        "Технические данные (IP-адрес, cookies, информация об устройстве и браузере)"
      ]
    },
    {
      title: "Цели обработки данных",
      icon: <Shield className="h-6 w-6" />,
      content: [
        "Регистрация и авторизация в сервисе",
        "Предоставление доступа к функционалу платформы",
        "Проведение оплат и выставление счетов",
        "Обратная связь и поддержка пользователей",
        "Улучшение качества сервиса"
      ]
    },
    {
      title: "Передача данных третьим лицам",
      icon: <Users className="h-6 w-6" />,
      content: [
        "По запросу государственных органов в рамках законодательства",
        "При использовании платёжных систем (IO Money, Payeer) для обработки транзакций",
        "Для обеспечения работы сервисов (например, хостинг-провайдеров)"
      ]
    },
    {
      title: "Хранение и защита данных",
      icon: <Lock className="h-6 w-6" />,
      content: [
        "Данные хранятся на защищённых серверах, доступ к которым ограничен",
        "Мы используем SSL-шифрование для передачи информации",
        "Срок хранения персональных данных — до достижения целей их обработки или до удаления аккаунта пользователем"
      ]
    },
    {
      title: "Права пользователя",
      icon: <Shield className="h-6 w-6" />,
      content: [
        "Получить доступ к своим персональным данным",
        "Запросить исправление или удаление данных",
        "Отозвать согласие на обработку данных",
        "Подать жалобу в контролирующие органы (Роскомнадзор или аналогичные органы ЕС)"
      ]
    },
    {
      title: "Платежи",
      icon: <CreditCard className="h-6 w-6" />,
      content: [
        "Все платежи обрабатываются через сторонние платёжные сервисы: IO Money, Payeer",
        "Мы не храним полные реквизиты платёжных карт и других финансовых инструментов",
        "Ответственность за обработку платежей несут указанные провайдеры"
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
                Политика <span className="gradient-primary bg-clip-text text-transparent">конфиденциальности</span>
              </h1>
              <Badge variant="secondary" className="bg-neon-green/20 text-neon-green border-neon-green/30 text-sm px-3 py-1">
                Privacy Policy
              </Badge>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            🔒 Защита ваших персональных данных в соответствии с ФЗ-152 и GDPR
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
                      Дата обновления: 01.09.2025
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Настоящая Политика конфиденциальности регулирует порядок обработки и защиты персональных данных 
                      пользователей сервиса SuperMock в соответствии с действующим законодательством.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Наши <span className="gradient-accent bg-clip-text text-transparent">сервисы</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              SuperMock доступен через следующие платформы:
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <Card className="neu-card border-0 hover:glow-primary transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌐</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Официальный сайт</h3>
                <p className="text-muted-foreground text-sm mb-4">Основная платформа</p>
                <Button variant="outline" size="sm" onClick={() => window.open('https://supermock.ru', '_blank')}>
                  supermock.ru
                </Button>
              </CardContent>
            </Card>
            
            <Card className="neu-card border-0 hover:glow-primary transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Веб-приложение</h3>
                <p className="text-muted-foreground text-sm mb-4">Основной функционал</p>
                <Button variant="outline" size="sm" onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}>
                  app.supermock.ru
                </Button>
              </CardContent>
            </Card>
            

          </div>
        </div>
      </section>

      {/* Policy Sections */}
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

      {/* Changes and Contacts Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="neu-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <span className="text-2xl">📝</span>
                  <span>Изменения политики</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Мы можем обновлять настоящую Политику. Дата последнего изменения всегда указывается в начале документа. 
                  Рекомендуем периодически просматривать данный раздел.
                </p>
              </CardContent>
            </Card>
            
            <Card className="neu-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <span className="text-2xl">📞</span>
                  <span>Контакты</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">support@supermock.ru</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🌐</span>
                    <span className="text-sm">supermock.ru</span>
                  </div>
                </div>
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
                  Соответствие <span className="gradient-accent bg-clip-text text-transparent">законодательству</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Наша политика конфиденциальности соответствует требованиям Федерального закона №152-ФЗ 
                  «О персональных данных» Российской Федерации, а также общим положениям GDPR 
                  (General Data Protection Regulation) для пользователей из Европейского Союза.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" size="lg">
                    <Shield className="mr-2 h-5 w-5" />
                    ФЗ-152
                  </Button>
                  <Button variant="outline" size="lg">
                    <Lock className="mr-2 h-5 w-5" />
                    GDPR
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
                  Остались <span className="gradient-accent bg-clip-text text-transparent">вопросы</span>?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Свяжитесь с нашей поддержкой для получения дополнительной информации о защите данных
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="animate-pulse-glow"
                    onClick={() => window.open('https://t.me/SuperMock_bot', '_blank')}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Написать в поддержку
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

export default PrivacyPolicy;
