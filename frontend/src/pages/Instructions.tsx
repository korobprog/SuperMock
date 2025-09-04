import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { navigateToExternal, handleExternalClick } from "@/lib/utils";
import { 
  Play,
  Users,
  Video,
  MessageSquare,
  Star,
  ArrowRight,
  ExternalLink,
  FileText,
  CheckCircle,
  Lightbulb,
  Mail,
  UserCheck,
  Search,
  Heart,
} from "lucide-react";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const Instructions = () => {
  const { t } = useTranslation();
  
  const steps = [
    {
      number: "1️⃣",
      title: t('instructions.steps.step1.title'),
      description: t('instructions.steps.step1.description'),
      icon: Play,
      color: "gradient-primary",
      details: t('instructions.steps.step1.details')
    },
    {
      number: "2️⃣",
      title: t('instructions.steps.step2.title'),
      description: t('instructions.steps.step2.description'),
      icon: Users,
      color: "gradient-secondary",
      details: t('instructions.steps.step2.details')
    },
    {
      number: "3️⃣",
      title: t('instructions.steps.step3.title'),
      description: t('instructions.steps.step3.description'),
      icon: UserCheck,
      color: "gradient-accent",
      details: t('instructions.steps.step3.details')
    },
    {
      number: "4️⃣",
      title: t('instructions.steps.step4.title'),
      description: t('instructions.steps.step4.description'),
      icon: Search,
      color: "gradient-primary",
      details: t('instructions.steps.step4.details')
    },
    {
      number: "5️⃣",
      title: t('instructions.steps.step5.title'),
      description: t('instructions.steps.step5.description'),
      icon: Video,
      color: "gradient-secondary",
      details: t('instructions.steps.step5.details')
    },
    {
      number: "6️⃣",
      title: t('instructions.steps.step6.title'),
      description: t('instructions.steps.step6.description'),
      icon: Star,
      color: "gradient-accent",
      details: t('instructions.steps.step6.details')
    }
  ];

  const tips = [
    {
      icon: Heart,
      title: t('instructions.tips.tip1.title'),
      description: t('instructions.tips.tip1.description')
    },
    {
      icon: MessageSquare,
      title: t('instructions.tips.tip2.title'),
      description: t('instructions.tips.tip2.description')
    },
    {
      icon: CheckCircle,
      title: t('instructions.tips.tip3.title'),
      description: t('instructions.tips.tip3.description')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            <span className="gradient-primary bg-clip-text text-transparent">{t('instructions.hero.title')}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {t('instructions.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="lg"
              onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
            >
              <Play className="mr-2 h-5 w-5" />
              {t('instructions.hero.startLearning')}
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.href = '/support'}>
              <Mail className="mr-2 h-5 w-5" />
              {t('instructions.hero.haveQuestions')}
            </Button>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t('instructions.steps.title')} <span className="gradient-accent bg-clip-text text-transparent">{t('instructions.steps.titleHighlight')}</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('instructions.steps.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="neu-card border-0 hover:glow-primary transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-2xl font-bold">{step.number}</span>
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                    <CardDescription className="text-base font-medium">{step.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {step.details}
                    </p>
                    <div className="w-full h-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full"></div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t('instructions.tips.title')} <span className="gradient-primary bg-clip-text text-transparent">{t('instructions.tips.titleHighlight')}</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('instructions.tips.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <Card key={index} className="neu-card border-0 hover:glow-accent transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center mx-auto mb-6">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">{tip.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {tip.description}
                    </p>
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
                  {t('instructions.cta.title')} <span className="gradient-accent bg-clip-text text-transparent">{t('instructions.cta.titleHighlight')}</span>{t('instructions.cta.titleSuffix')}
                </h2>
                <p className="text-xl text-muted-foreground">
                  {t('instructions.cta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="wave-shimmer"
                    onClick={() => window.location.href = '/support'}
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    {t('instructions.cta.contactUs')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="xl" 
                    onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    {t('instructions.cta.startPractice')}
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

export default Instructions;
