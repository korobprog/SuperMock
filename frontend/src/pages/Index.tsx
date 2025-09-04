import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import ProfessionsSection from "@/components/ProfessionsSection";
import { navigateToExternal, handleExternalClick } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { 
  Mic, 
  Code, 
  MessageCircle, 
  BarChart3, 
  FileText, 
  Gamepad2,
  Lightbulb,
} from "lucide-react";
import heroImage from "@/assets/hero-ai-illustration.jpg";

const Index = () => {
  const { t } = useTranslation();
  
  const languages = [
    { code: "🇺🇸", name: "English" },
    { code: "🇷🇺", name: "Russian" },
    { code: "🇪🇸", name: "Spanish" },
    { code: "🇫🇷", name: "French" },
    { code: "🇩🇪", name: "German" },
    { code: "🇨🇳", name: "Chinese" }
  ];

  const features = [
    { icon: Mic, title: t('features.webrtc.title'), description: t('features.webrtc.description') },
    { icon: Code, title: t('features.coding.title'), description: t('features.coding.description') },
    { icon: MessageCircle, title: t('features.chat.title'), description: t('features.chat.description') },
    { icon: BarChart3, title: t('features.ai.title'), description: t('features.ai.description') },
    { icon: FileText, title: t('features.feedback.title'), description: t('features.feedback.description') },
    { icon: Gamepad2, title: t('features.learning.title'), description: t('features.learning.description') }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  {t('hero.title')}{" "}
                  <span className="gradient-primary bg-clip-text text-transparent">
                    {t('hero.titleHighlight')}
                  </span>{" "}
                  {t('hero.titleSuffix')}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {t('hero.subtitle')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="wave-shimmer"
                  onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
                >
                  {t('hero.startLearning')}
                </Button>
                <Button 
                  variant="hero-secondary" 
                  size="xl"
                  onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
                >
                  {t('hero.openApp')}
                </Button>
                <Button 
                  variant="outline" 
                  size="xl"
                  onClick={() => window.location.href = '/instructions'}
                >
                  {t('hero.help')}
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                <div className="neu-card p-6 text-center rounded-2xl">
                  <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">10+</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-tight break-words" 
                       dangerouslySetInnerHTML={{ __html: t('stats.professions') }}></div>
                </div>
                <div className="neu-card p-6 text-center rounded-2xl">
                  <div className="text-3xl font-bold gradient-secondary bg-clip-text text-transparent">6</div>
                  <div className="text-xs text-muted-foreground mt-1" 
                       dangerouslySetInnerHTML={{ __html: t('stats.languages') }}></div>
                </div>
                <div className="neu-card p-6 text-center rounded-2xl">
                  <div className="text-3xl font-bold gradient-accent bg-clip-text text-transparent">1000</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-tight break-words" 
                       dangerouslySetInnerHTML={{ __html: t('stats.interviews') }}></div>
                </div>
                <div className="neu-card p-6 text-center rounded-2xl">
                  <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">87%</div>
                  <div className="text-xs text-muted-foreground mt-1" 
                       dangerouslySetInnerHTML={{ __html: t('stats.success') }}></div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <img 
                  src={heroImage} 
                  alt="AI Interview Platform Illustration" 
                  className="rounded-2xl shadow-2xl animate-float neu-card"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-neon-blue/20 to-neon-purple/20 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t('features.title')}{" "}
              <span className="gradient-secondary bg-clip-text text-transparent">{t('features.titleHighlight')}</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="neu-card border-0 hover:glow-primary transition-all duration-300 hover:scale-105 cursor-pointer">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Professions Section */}
      <ProfessionsSection />

      {/* Languages Section */}
      <section id="languages" className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t('languages.title')}{" "}
              <span className="gradient-primary bg-clip-text text-transparent">{t('languages.titleHighlight')}</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('languages.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-4xl font-bold">
                  {t('pricing.title')}{" "}
                  <span className="gradient-primary bg-clip-text text-transparent">{t('pricing.titleHighlight')}</span>
                </h2>
                <Badge variant="secondary" className="bg-neon-green/20 text-neon-green border-neon-green/30 text-sm px-3 py-1">
                  BETA
                </Badge>
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('pricing.subtitle')}
            </p>
            
            {/* Beta Version Notice */}
            <div className="max-w-4xl mx-auto">
              <Card className="neu-card border-0 bg-gradient-to-r from-primary/5 to-secondary/5 mb-8">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">💡</span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold mb-2 text-foreground">
                        {t('pricing.betaNotice.title')}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('pricing.betaNotice.description')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center mb-12">
              <Button 
                variant="hero" 
                size="xl" 
                className="hover:scale-105 transition-all duration-300"
                onClick={() => window.location.href = '/pricing'}
              >
                {t('pricing.learnMore')}
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="neu-card border-0 hover:glow-primary transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-2">{t('pricing.free.title')}</CardTitle>
                <div className="space-y-2">
                  <div className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">{t('pricing.free.price')}</div>
                  <div className="text-sm text-muted-foreground">{t('pricing.free.period')}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {t('pricing.free.features', { returnObjects: true }).map((feature: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-neon-green mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full" size="lg">
                  {t('pricing.free.select')}
                </Button>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card className="neu-card border-0 hover:glow-secondary transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-2">{t('pricing.basic.title')}</CardTitle>
                <div className="space-y-2">
                  <div className="text-4xl font-bold gradient-secondary bg-clip-text text-transparent">{t('pricing.basic.price')}</div>
                  <div className="text-sm text-muted-foreground">{t('pricing.basic.period')}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {t('pricing.basic.features', { returnObjects: true }).map((feature: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-neon-cyan mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full" size="lg">
                  {t('pricing.basic.select')}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan - Highlighted */}
            <Card className="neu-card border-0 relative overflow-hidden hover:glow-accent transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-primary"></div>
              <CardHeader className="text-center pb-4 relative">
                <div className="absolute top-1 right-4 z-10">
                  <Badge variant="secondary" className="bg-neon-green/20 text-neon-green border-neon-green/30">
                    {t('pricing.pro.popular')}
                  </Badge>
                </div>
                <CardTitle className="text-2xl mb-2">{t('pricing.pro.title')}</CardTitle>
                <div className="space-y-2">
                  <div className="text-4xl font-bold gradient-accent bg-clip-text text-transparent">{t('pricing.pro.price')}</div>
                  <div className="text-sm text-muted-foreground">{t('pricing.pro.period')}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {t('pricing.pro.features', { returnObjects: true }).map((feature: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-neon-purple mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="hero" 
                  className="w-full wave-shimmer" 
                  size="lg"
                  onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
                >
                  {t('pricing.pro.select')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Responsibility Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <Card className="neu-card border-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <CardContent className="p-12 text-center">
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <span className="text-3xl">💜</span>
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-foreground">
                    {t('social.title')}
                  </h2>
                  
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    {t('social.subtitle')}
                  </p>
                  
                  <div className="text-left max-w-3xl mx-auto space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {t('social.description')}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">{t('social.donations')}</strong>
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">{t('social.accessibility')}</strong>
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-lg text-muted-foreground leading-relaxed pt-4">
                      {t('social.conclusion')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                {t('about.title')}{" "}
                <span className="gradient-accent bg-clip-text text-transparent">{t('about.titleHighlight')}</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {t('about.description1')}
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                {t('about.description2')}
              </p>
              <Button variant="hero" size="lg" onClick={() => window.location.href = '/learning-process'}>
                {t('about.learnMore')}
              </Button>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-2xl gradient-primary opacity-20 animate-pulse-glow"></div>
                <div className="absolute inset-4 rounded-2xl neu-card flex items-center justify-center">
                  <div className="text-center">
                    <Lightbulb className="h-16 w-16 mx-auto mb-4 text-neon-cyan" />
                    <h3 className="text-xl font-bold mb-2">AI + Multilingual</h3>
                    <p className="text-muted-foreground">Smart technologies for global community</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;