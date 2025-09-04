import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { navigateToExternal, handleExternalClick } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const Languages = () => {
  const { t } = useTranslation();
  
  const languages = [
    { code: "🇺🇸", name: t('languages.english'), description: t('languages.englishDesc') },
    { code: "🇷🇺", name: t('languages.russian'), description: t('languages.russianDesc') },
    { code: "🇪🇸", name: t('languages.spanish'), description: t('languages.spanishDesc') },
    { code: "🇫🇷", name: t('languages.french'), description: t('languages.frenchDesc') },
    { code: "🇩🇪", name: t('languages.german'), description: t('languages.germanDesc') },
    { code: "🇨🇳", name: t('languages.chinese'), description: t('languages.chineseDesc') }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            {t('languages.title')} <span className="gradient-primary bg-clip-text text-transparent">{t('languages.titleHighlight')}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {t('languages.subtitle')}
          </p>
        </div>
      </section>

      {/* Languages Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
            {languages.map((language, index) => (
              <Card key={index} className="neu-card border-0 hover:glow-accent transition-all duration-300 hover:scale-105 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{language.code}</div>
                  <h3 className="font-medium mb-2">{language.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {language.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="neu-card border-0">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold mb-2">{t('languages.benefits.global.title')}</h3>
                <p className="text-muted-foreground">
                  {t('languages.benefits.global.description')}
                </p>
              </CardContent>
            </Card>
            <Card className="neu-card border-0">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">{t('languages.benefits.colleagues.title')}</h3>
                <p className="text-muted-foreground">
                  {t('languages.benefits.colleagues.description')}
                </p>
              </CardContent>
            </Card>
            <Card className="neu-card border-0">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">{t('languages.benefits.communication.title')}</h3>
                <p className="text-muted-foreground">
                  {t('languages.benefits.communication.description')}
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
                  {t('languages.cta.title')} <span className="gradient-accent bg-clip-text text-transparent">{t('languages.cta.titleHighlight')}</span> {t('languages.cta.titleSuffix')}
                </h2>
                <p className="text-xl text-muted-foreground">
                  {t('languages.cta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="wave-shimmer"
                    onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
                  >
                    {t('languages.cta.startLearning')}
                  </Button>
                  <Button variant="outline" size="xl" onClick={() => window.location.href = '/learning-process'}>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    {t('languages.cta.learningProcess')}
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

export default Languages;
