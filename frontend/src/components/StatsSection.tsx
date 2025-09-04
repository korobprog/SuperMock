interface StatItem {
  value: string;
  label: string;
  gradient: "primary" | "secondary" | "accent";
}

interface StatsSectionProps {
  stats: StatItem[];
  className?: string;
}

const StatsSection = ({ stats, className = "" }: StatsSectionProps) => {
  const getGradientClass = (gradient: string) => {
    switch (gradient) {
      case "primary":
        return "gradient-primary bg-clip-text text-transparent";
      case "secondary":
        return "gradient-secondary bg-clip-text text-transparent";
      case "accent":
        return "gradient-accent bg-clip-text text-transparent";
      default:
        return "gradient-primary bg-clip-text text-transparent";
    }
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <div key={index} className="neu-card p-6 text-center rounded-2xl">
          <div className={`text-3xl font-bold ${getGradientClass(stat.gradient)}`}>
            {stat.value}
          </div>
          <div className="text-xs text-muted-foreground mt-1 leading-tight break-words">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsSection;
