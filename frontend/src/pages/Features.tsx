import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeatureCard from "@/components/FeatureCard";
import CTASection from "@/components/CTASection";
import { navigateToExternal, handleExternalClick } from "@/lib/utils";
import { 
  Mic, 
  Code, 
  MessageCircle, 
  BarChart3, 
  FileText, 
  Gamepad2,
  ArrowRight
} from "lucide-react";

const Features = () => {
  const features = [
    { icon: Mic, title: "WebRTC видеозвонки", description: "Качественная связь в реальном времени" },
    { icon: Code, title: "Программирование в реальном времени", description: "Совместное написание кода" },
    { icon: MessageCircle, title: "Чат интервьюер ↔ кандидат", description: "Мгновенная коммуникация" },
    { icon: BarChart3, title: "AI анализ", description: "Умная оценка навыков" },
    { icon: FileText, title: "Персонализированная обратная связь", description: "Детальные рекомендации" },
    { icon: Gamepad2, title: "Интерактивное обучение", description: "Геймификация процесса" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <HeroSection
        title="Возможности"
        titleAccent="платформы"
        description="Современные технологии для эффективной подготовки к собеседованиям"
      />

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                hoverEffect="glow-primary"
              />
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Готовы"
        titleAccent="попробовать"
        description="Начните использовать все возможности платформы для подготовки к собеседованиям"
        primaryButtonText="Начать обучение"
        primaryButtonAction={() => handleExternalClick('https://app.supermock.ru')}
        secondaryButtonText="Процесс обучения"
        secondaryButtonAction={() => window.location.href = '/learning-process'}
        secondaryButtonIcon={ArrowRight}
      />

      <Footer />
    </div>
  );
};

export default Features;
