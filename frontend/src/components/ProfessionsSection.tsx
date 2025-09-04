import { Card, CardContent } from "@/components/ui/card";
import { professions, type Profession } from "@/data/professions";
import { navigateToExternal, handleExternalClick } from "@/lib/utils";

interface ProfessionsSectionProps {
  className?: string;
}

const ProfessionsSection: React.FC<ProfessionsSectionProps> = ({ className = "" }) => {
  return (
    <section id="professions" className={`py-16 px-6 ${className}`}>
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Технические <span className="gradient-accent bg-clip-text text-transparent">профессии</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Подготовка к собеседованиям по всем IT-направлениям
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {professions.map((profession, index) => {
            const Icon = profession.icon;
            return (
              <Card 
                key={index} 
                className="neu-card border-0 hover:glow-secondary transition-all duration-300 hover:scale-105 cursor-pointer group"
                style={{ cursor: 'pointer' }}
                onClick={(e) => handleExternalClick('https://app.supermock.ru', e)}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl gradient-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className={`h-8 w-8 text-white ${profession.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{profession.name}</h3>
                  {profession.description && (
                    <p className="text-sm text-muted-foreground leading-tight">
                      {profession.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProfessionsSection;
