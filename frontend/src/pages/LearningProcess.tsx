import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { navigateToExternal, handleExternalClick } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import { 
  Code,  
  MessageSquare, 
  Brain,
  BookOpen,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  Languages,
  Briefcase,
  Settings,
  Video,
  Play
} from "lucide-react";

const LearningProcess = () => {
  const { t } = useTranslation();

  const languages = [
    { code: "🇺🇸", name: "English" },
    { code: "🇷🇺", name: "Russian" },
    { code: "🇪🇸", name: "Spanish" },
    { code: "🇫🇷", name: "French" },
    { code: "🇩🇪", name: "German" },
    { code: "🇨🇳", name: "Chinese" }
  ];

  const professions = [
    "Frontend Developer",
    "Backend Developer", 
    "Fullstack Developer",
    "Mobile Developer",
    "DevOps Engineer",
    "QA Engineer",
    "UX/UI Designer",
    "Data Analyst",
    "Data Scientist",
    "Product Manager"
  ];

  const processSteps = [
    {
      id: 1,
      title: t("learningProcess.processSteps.step1.title"),
      description: t("learningProcess.processSteps.step1.description"),
      icon: Languages,
      iconColor: "gradient-primary",
      details: t("learningProcess.processSteps.step1.details")
    },
    {
      id: 2,
      title: t("learningProcess.processSteps.step2.title"),
      description: t("learningProcess.processSteps.step2.description"),
      icon: Briefcase,
      iconColor: "gradient-secondary",
      details: t("learningProcess.processSteps.step2.details")
    },
    {
      id: 3,
      title: t("learningProcess.processSteps.step3.title"),
      description: t("learningProcess.processSteps.step3.description"),
      icon: Settings,
      iconColor: "gradient-accent",
      details: t("learningProcess.processSteps.step3.details")
    },
    {
      id: 4,
      title: t("learningProcess.processSteps.step4.title"),
      description: t("learningProcess.processSteps.step4.description"),
      icon: Video,
      iconColor: "gradient-primary",
      details: t("learningProcess.processSteps.step4.details")
    },
    {
      id: 5,
      title: t("learningProcess.processSteps.step5.title"),
      description: t("learningProcess.processSteps.step5.description"),
      icon: MessageSquare,
      iconColor: "gradient-secondary",
      details: t("learningProcess.processSteps.step5.details")
    },
    {
      id: 6,
      title: t("learningProcess.processSteps.step6.title"),
      description: t("learningProcess.processSteps.step6.description"),
      icon: Brain,
      iconColor: "gradient-accent",
      details: t("learningProcess.processSteps.step6.details")
    },
    {
      id: 7,
      title: t("learningProcess.processSteps.step7.title"),
      description: t("learningProcess.processSteps.step7.description"),
      icon: BookOpen,
      iconColor: "gradient-primary",
      details: t("learningProcess.processSteps.step7.details")
    },
    {
      id: 8,
      title: t("learningProcess.processSteps.step8.title"),
      description: t("learningProcess.processSteps.step8.description"),
      icon: RefreshCw,
      iconColor: "gradient-secondary",
      details: t("learningProcess.processSteps.step8.details")
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            {t("learningProcess.hero.title")} <span className="gradient-primary bg-clip-text text-transparent">{t("learningProcess.hero.titleHighlight")}</span>
          </h1>
          <p className="text-xl text-foreground max-w-3xl mx-auto mb-8">
            {t("learningProcess.hero.subtitle")}
          </p>
          <Button 
            variant="hero" 
            size="xl" 
            className="wave-shimmer"
            onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
          >
            <Play className="mr-2 h-5 w-5" />
            {t("learningProcess.hero.startLearning")}
          </Button>
        </div>
      </section>

      {/* Process Mind Map */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="relative">
                  {/* Connection Lines */}
                  {index < processSteps.length - 1 && (
                    <div className="absolute left-1/2 top-full w-0.5 h-8 bg-gradient-to-b from-primary/50 to-secondary/50 transform -translate-x-1/2 z-0"></div>
                  )}
                  
                  <Card className="neu-card border-0 hover:glow-primary transition-all duration-300 hover:scale-105 relative z-10">
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 mx-auto rounded-2xl ${step.iconColor} flex items-center justify-center mb-4`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex items-center justify-center mb-2">
                        <Badge variant="secondary" className="mr-2">
                          {step.id}
                        </Badge>
                        <CardTitle className="text-xl text-foreground">{step.title}</CardTitle>
                      </div>
                      <CardDescription className="text-base font-medium text-muted-foreground">
                        {step.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground text-center leading-relaxed">
                        {step.details}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t("learningProcess.languagesSection.title")} <span className="gradient-primary bg-clip-text text-transparent">{t("learningProcess.languagesSection.titleHighlight")}</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              {t("learningProcess.languagesSection.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
            {languages.map((language, index) => (
              <Card key={index} className="neu-card border-0 hover:glow-accent transition-all duration-300 hover:scale-105 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{language.code}</div>
                  <h3 className="font-medium">{language.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Professions Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t("learningProcess.professionsSection.title")} <span className="gradient-secondary bg-clip-text text-transparent">{t("learningProcess.professionsSection.titleHighlight")}</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              {t("learningProcess.professionsSection.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {professions.map((profession, index) => (
              <Card key={index} className="neu-card border-0 hover:glow-secondary transition-all duration-300 hover:scale-105 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl gradient-secondary flex items-center justify-center mb-4">
                    <Code className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg leading-tight">{profession}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Process by Plan Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="gradient-primary bg-clip-text text-transparent">{t("learningProcess.plansSection.title")}</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              {t("learningProcess.plansSection.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="neu-card border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">{t("learningProcess.plansSection.free.title")}</CardTitle>
                <CardDescription>{t("learningProcess.plansSection.free.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-neon-green mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{t("learningProcess.plansSection.free.features.mockInterviews.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("learningProcess.plansSection.free.features.mockInterviews.description")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-neon-green mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{t("learningProcess.plansSection.free.features.basicFeedback.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("learningProcess.plansSection.free.features.basicFeedback.description")}</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}>
                  {t("learningProcess.plansSection.free.select")}
                </Button>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card className="neu-card border-0 ring-2 ring-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">{t("learningProcess.plansSection.basic.title")}</CardTitle>
                <CardDescription>{t("learningProcess.plansSection.basic.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-neon-green mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{t("learningProcess.plansSection.basic.features.mockInterviews.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("learningProcess.plansSection.basic.features.mockInterviews.description")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-neon-green mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{t("learningProcess.plansSection.basic.features.aiAssistant.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("learningProcess.plansSection.basic.features.aiAssistant.description")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-neon-green mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{t("learningProcess.plansSection.basic.features.aiAnalysis.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("learningProcess.plansSection.basic.features.aiAnalysis.description")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-neon-green mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{t("learningProcess.plansSection.basic.features.advancedAnalytics.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("learningProcess.plansSection.basic.features.advancedAnalytics.description")}</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}>
                  {t("learningProcess.plansSection.basic.select")}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="neu-card border-0 ring-2 ring-accent/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">{t("learningProcess.plansSection.pro.title")}</CardTitle>
                <CardDescription>{t("learningProcess.plansSection.pro.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-neon-green mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{t("learningProcess.plansSection.pro.features.allBasicFeatures.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("learningProcess.plansSection.pro.features.allBasicFeatures.description")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-neon-green mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{t("learningProcess.plansSection.pro.features.appLearning.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("learningProcess.plansSection.pro.features.appLearning.description")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-neon-green mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{t("learningProcess.plansSection.pro.features.cycleRepetition.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("learningProcess.plansSection.pro.features.cycleRepetition.description")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-neon-green mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{t("learningProcess.plansSection.pro.features.prioritySupport.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("learningProcess.plansSection.pro.features.prioritySupport.description")}</p>
                    </div>
                  </div>
                </div>
                <Button variant="hero" className="w-full wave-shimmer" onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}>
                  {t("learningProcess.plansSection.pro.select")}
                </Button>
              </CardContent>
            </Card>
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
                  {t("learningProcess.cta.title")} <span className="gradient-accent bg-clip-text text-transparent">{t("learningProcess.cta.titleHighlight")}</span> {t("learningProcess.cta.titleSuffix")}
                </h2>
                <p className="text-xl text-muted-foreground">
                  {t("learningProcess.cta.subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="wave-shimmer"
                    onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    {t("learningProcess.cta.startLearning")}
                  </Button>
                  <Button variant="outline" size="xl" onClick={() => window.location.href = '/pricing'}>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    {t("learningProcess.cta.comparePlans")}
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

export default LearningProcess;
