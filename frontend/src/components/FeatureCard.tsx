import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: "primary" | "secondary" | "accent";
  hoverEffect?: "glow-primary" | "glow-secondary" | "glow-accent" | "scale";
  className?: string;
  onClick?: () => void;
}

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  gradient = "primary",
  hoverEffect = "glow-primary",
  className = "",
  onClick
}: FeatureCardProps) => {
  const getGradientClass = () => {
    switch (gradient) {
      case "primary":
        return "gradient-primary";
      case "secondary":
        return "gradient-secondary";
      case "accent":
        return "gradient-accent";
      default:
        return "gradient-primary";
    }
  };

  const getHoverClass = () => {
    switch (hoverEffect) {
      case "glow-primary":
        return "hover:glow-primary";
      case "glow-secondary":
        return "hover:glow-secondary";
      case "glow-accent":
        return "hover:glow-accent";
      case "scale":
        return "hover:scale-105";
      default:
        return "hover:glow-primary";
    }
  };

  return (
    <Card 
      className={`neu-card border-0 transition-all duration-300 ${getHoverClass()} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className={`w-12 h-12 rounded-2xl ${getGradientClass()} flex items-center justify-center mb-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
