import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { navigateToExternal, handleExternalClick } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { ArrowRight, Check, X } from "lucide-react";
import Logo from "@/components/Logo";
import { useTranslation } from "react-i18next";

const Pricing = () => {
  const { t } = useTranslation();
  
  const plans = [
    {
      name: t('pricing.free.title'),
      price: t('pricing.free.price'),
      period: t('pricing.free.period'),
      included: t('pricing.free.features', { returnObjects: true }) as string[],
      excluded: [
        t('features.ai.title'),
        t('learningProcess.processSteps.step6.title'),
        t('features.feedback.title'),
        t('learningProcess.processSteps.step7.title'),
        t('learningProcess.processSteps.step7.description'),
        t('learningProcess.plansSection.pro.features.prioritySupport.title')
      ],
      popular: false,
      buttonText: t('pricing.free.select'),
      buttonVariant: "outline" as const
    },
    {
      name: t('pricing.basic.title'),
      price: t('pricing.basic.price'),
      period: t('pricing.basic.period'),
      included: t('pricing.basic.features', { returnObjects: true }) as string[],
      excluded: [
        t('learningProcess.processSteps.step7.title'),
        t('learningProcess.processSteps.step7.description'),
        t('learningProcess.processSteps.step8.title'),
        t('learningProcess.processSteps.step8.description'),
        t('learningProcess.plansSection.pro.features.prioritySupport.title'),
        t('learningProcess.plansSection.pro.features.prioritySupport.description')
      ],
      popular: false,
      buttonText: t('pricing.basic.select'),
      buttonVariant: "outline" as const
    },
    {
      name: t('pricing.pro.title'),
      price: t('pricing.pro.price'),
      period: t('pricing.pro.period'),
      included: [
        t('pricing.proDiscount'),
        ...(t('pricing.pro.features', { returnObjects: true }) as string[])
      ],
      excluded: [],
      popular: true,
      buttonText: t('pricing.pro.select'),
      buttonVariant: "hero" as const
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
                {t('pricing.title')}{" "}
                <span className="gradient-primary bg-clip-text text-transparent">
                  {t('pricing.titleHighlight')}
                </span>
              </h1>
              <Badge variant="secondary" className="bg-neon-green/20 text-neon-green border-neon-green/30 text-sm px-3 py-1">
                BETA
              </Badge>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
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
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`neu-card border-0 relative overflow-hidden hover:glow-primary transition-all duration-300 hover:scale-105 ${plan.popular ? 'ring-2 ring-primary/20' : ''}`}>
                {plan.popular && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-1 gradient-primary"></div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-neon-green/20 text-neon-green border-neon-green/30">
                        {t('pricing.pro.popular')}
                      </Badge>
                    </div>
                  </>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">{plan.price}</div>
                    <div className="text-sm text-muted-foreground">{plan.period}</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Included Features */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-foreground mb-3">{t('pricing.included')}</h4>
                    {plan.included.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-neon-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-neon-green" />
                        </div>
                        <span className="text-sm leading-relaxed text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Excluded Features */}
                  {plan.excluded.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3">{t('pricing.excluded')}</h4>
                      {plan.excluded.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="w-3 h-3 text-red-500" />
                          </div>
                          <span className="text-sm leading-relaxed text-muted-foreground line-through">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button 
                    variant={plan.buttonVariant} 
                    className="w-full wave-shimmer" 
                    size="lg"
                    onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
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
                          <strong className="text-foreground">{t('social.donationsPrefix')}</strong> {t('social.donations')}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">{t('social.accessibilityPrefix')}</strong> {t('social.accessibility')}
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

      {/* FAQ Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="neu-card border-0">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">{t('pricingFaq.howToChoose.question')}</h3>
                <p className="text-muted-foreground">
                  {t('pricingFaq.howToChoose.answer')}
                </p>
              </CardContent>
            </Card>
            <Card className="neu-card border-0">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">{t('pricingFaq.cancelSubscription.question')}</h3>
                <p className="text-muted-foreground">
                  {t('pricingFaq.cancelSubscription.answer')}
                </p>
              </CardContent>
            </Card>
            <Card className="neu-card border-0">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">{t('pricingFaq.trialPeriod.question')}</h3>
                <p className="text-muted-foreground">
                  {t('pricingFaq.trialPeriod.answer')}
                </p>
              </CardContent>
            </Card>
            <Card className="neu-card border-0">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">{t('pricingFaq.paymentMethods.question')}</h3>
                <p className="text-muted-foreground">
                  {t('pricingFaq.paymentMethods.answer')}
                </p>
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
                  {t('pricingCta.title')}{" "}
                  <span className="gradient-accent bg-clip-text text-transparent">
                    {t('pricingCta.titleHighlight')}
                  </span>{" "}
                  {t('pricingCta.titleSuffix')}
                </h2>
                <p className="text-xl text-muted-foreground">
                  {t('pricingCta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="animate-pulse-glow"
                    onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
                  >
                    {t('pricingCta.startLearning')}
                  </Button>
                  <Button variant="outline" size="xl" onClick={() => window.location.href = '/learning-process'}>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    {t('pricingCta.learningProcess')}
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

export default Pricing;
