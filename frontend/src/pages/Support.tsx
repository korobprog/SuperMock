import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { Heart, MessageCircle, GraduationCap, Percent, Users, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

const Support = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="container mx-auto text-center">
          <div className="flex flex-col items-center space-y-4 mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="gradient-primary bg-clip-text text-transparent">{t('support.hero.title')}</span>
              </h1>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {t('support.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Support Options Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Learning */}
            <Card className="neu-card border-0 hover:glow-primary transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle className="text-2xl mb-2">{t('support.supportOptions.freeLearning.title')}</CardTitle>
                <CardDescription className="text-base">
                  {t('support.supportOptions.freeLearning.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {(t('support.supportOptions.freeLearning.features', { returnObjects: true }) as string[]).map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Discounts */}
            <Card className="neu-card border-0 hover:glow-secondary transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                  <Percent className="h-8 w-8 text-blue-500" />
                </div>
                <CardTitle className="text-2xl mb-2">{t('support.supportOptions.discounts.title')}</CardTitle>
                <CardDescription className="text-base">
                  {t('support.supportOptions.discounts.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {(t('support.supportOptions.discounts.features', { returnObjects: true }) as string[]).map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <Card className="neu-card border-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <CardContent className="p-12">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">
                    {t('support.howItWorks.title')}
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    {t('support.howItWorks.subtitle')}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto">
                      <span className="text-xl font-bold">1</span>
                    </div>
                    <h3 className="text-lg font-semibold">{t('support.howItWorks.steps.step1.title')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('support.howItWorks.steps.step1.description')}
                    </p>
                  </div>

                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center mx-auto">
                      <span className="text-xl font-bold">2</span>
                    </div>
                    <h3 className="text-lg font-semibold">{t('support.howItWorks.steps.step2.title')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('support.howItWorks.steps.step2.description')}
                    </p>
                  </div>

                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mx-auto">
                      <span className="text-xl font-bold">3</span>
                    </div>
                    <h3 className="text-lg font-semibold">{t('support.howItWorks.steps.step3.title')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('support.howItWorks.steps.step3.description')}
                    </p>
                  </div>
                </div>
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
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
                    <MessageCircle className="h-10 w-10 text-red-500" />
                  </div>
                </div>
                
                <h2 className="text-4xl font-bold">
                  {t('support.cta.title')}{" "}
                  <span className="gradient-accent bg-clip-text text-transparent">
                    {t('support.cta.titleHighlight')}
                  </span>{" "}
                  {t('support.cta.titleSuffix')}
                </h2>
                
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {t('support.cta.subtitle')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="hover:scale-105 transition-all duration-300"
                    onClick={() => window.open('https://t.me/korobprog', '_blank')}
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    {t('support.cta.buttonText')}
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {t('support.cta.responseTime')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Social Impact Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <Card className="neu-card border-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
              <CardContent className="p-12 text-center">
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-foreground">
                    {t('support.socialImpact.title')}
                  </h2>
                  
                  <div className="grid md:grid-cols-3 gap-8 mt-8">
                    <div className="space-y-2">
                      <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                        {t('support.socialImpact.stats.donations.value')}
                      </div>
                      <p className="text-muted-foreground">
                        {t('support.socialImpact.stats.donations.description')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold gradient-secondary bg-clip-text text-transparent">
                        {t('support.socialImpact.stats.peopleHelped.value')}
                      </div>
                      <p className="text-muted-foreground">
                        {t('support.socialImpact.stats.peopleHelped.description')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold gradient-accent bg-clip-text text-transparent">
                        {t('support.socialImpact.stats.responseTime.value')}
                      </div>
                      <p className="text-muted-foreground">
                        {t('support.socialImpact.stats.responseTime.description')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Support;
