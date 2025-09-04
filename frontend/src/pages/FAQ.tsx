import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { navigateToExternal, handleExternalClick } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { 
  HelpCircle, 
  MessageSquare, 
  ArrowRight,
  Search,
  BookOpen,
  Users,
  CreditCard,
  Settings
} from "lucide-react";

const FAQ = () => {
  const faqCategories = [
    {
      title: "Общие вопросы",
      icon: HelpCircle,
      color: "gradient-primary",
      questions: [
        {
          question: "Что такое Super Mock?",
          answer: "Super Mock — это AI-платформа для подготовки к техническим собеседованиям с поддержкой 6 языков и персонализированной обратной связью."
        },
        {
          question: "Как начать использовать платформу?",
          answer: "Зарегистрируйтесь, выберите язык и профессию, затем начните с первого мокового собеседования."
        },
        {
          question: "Какие языки поддерживаются?",
          answer: "Платформа поддерживает 6 языков: английский, русский, испанский, французский, немецкий и китайский."
        }
      ]
    },
    {
      title: "Технические вопросы",
      icon: Settings,
      color: "gradient-secondary",
      questions: [
        {
          question: "Какие требования к оборудованию?",
          answer: "Вам понадобится компьютер с камерой, микрофоном и стабильным интернет-соединением."
        },
        {
          question: "Почему не работает видеозвонок?",
          answer: "Проверьте разрешения браузера для камеры и микрофона, а также убедитесь в стабильности интернет-соединения."
        },
        {
          question: "Как улучшить качество связи?",
          answer: "Используйте проводное интернет-соединение, закройте лишние вкладки браузера и убедитесь в хорошем освещении."
        }
      ]
    },
    {
      title: "Аккаунт и оплата",
      icon: CreditCard,
      color: "gradient-accent",
      questions: [
        {
          question: "Как отменить подписку?",
          answer: "Вы можете отменить подписку в любое время в настройках аккаунта. Оплаченный период останется активным."
        },
        {
          question: "Какие способы оплаты принимаются?",
          answer: "Мы принимаем оплату в USD через различные платежные системы."
        },
        {
          question: "Есть ли пробный период?",
          answer: "Да, Free план позволяет бесплатно протестировать основные возможности платформы."
        }
      ]
    },
    {
      title: "Функциональность",
      icon: BookOpen,
      color: "gradient-primary",
      questions: [
        {
          question: "Как работает AI анализ?",
          answer: "ИИ анализирует ваши ответы, поведение и навыки, предоставляя персонализированные рекомендации для улучшения."
        },
        {
          question: "Можно ли проходить собеседования на разных языках?",
          answer: "Да, вы можете переключаться между языками и проходить собеседования на любом из 6 поддерживаемых языков."
        },
        {
          question: "Как выбрать подходящую профессию?",
          answer: "Изучите описания профессий и выберите ту, которая соответствует вашим навыкам и целям развития."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            <span className="gradient-primary bg-clip-text text-transparent">FAQ</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Ответы на часто задаваемые вопросы о платформе Super Mock
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="lg"
              onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
            >
              <Search className="mr-2 h-5 w-5" />
              Поиск по FAQ
            </Button>
            <Button variant="outline" size="lg">
              <MessageSquare className="mr-2 h-5 w-5" />
              Задать вопрос
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Часто задаваемые <span className="gradient-secondary bg-clip-text text-transparent">вопросы</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Выберите категорию для просмотра ответов на вопросы
            </p>
          </div>

          <div className="space-y-12 max-w-6xl mx-auto">
            {faqCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card key={index} className="neu-card border-0">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl ${category.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-2xl">{category.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {category.questions.map((item, itemIndex) => (
                        <div key={itemIndex} className="border-b border-border/50 pb-6 last:border-b-0">
                          <h3 className="text-lg font-semibold mb-3 text-foreground">
                            {item.question}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="neu-card p-6 text-center rounded-2xl">
              <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">50+</div>
              <div className="text-sm text-muted-foreground mt-1">Вопросов в FAQ</div>
            </div>
            <div className="neu-card p-6 text-center rounded-2xl">
              <div className="text-3xl font-bold gradient-secondary bg-clip-text text-transparent">95%</div>
              <div className="text-sm text-muted-foreground mt-1">Пользователей находят ответы</div>
            </div>
            <div className="neu-card p-6 text-center rounded-2xl">
              <div className="text-3xl font-bold gradient-accent bg-clip-text text-transparent">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">Поддержка доступна</div>
            </div>
            <div className="neu-card p-6 text-center rounded-2xl">
              <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">5мин</div>
              <div className="text-sm text-muted-foreground mt-1">Среднее время ответа</div>
            </div>
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
                  Не нашли <span className="gradient-accent bg-clip-text text-transparent">ответ</span>?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Наша команда поддержки готова помочь вам с любыми вопросами
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="animate-pulse-glow"
                    onClick={() => window.location.href = '/support'}
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Связаться с поддержкой
                  </Button>
                  <Button variant="outline" size="xl" onClick={() => window.location.href = '/documentation'}>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Документация
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

export default FAQ;
