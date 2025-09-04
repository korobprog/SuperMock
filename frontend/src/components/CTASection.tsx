import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface CTASectionProps {
  title: string;
  titleAccent: string;
  description: string;
  primaryButtonText: string;
  primaryButtonAction: () => void;
  secondaryButtonText?: string;
  secondaryButtonAction?: () => void;
  secondaryButtonIcon?: React.ComponentType<{ className?: string }>;
}

const CTASection = ({
  title,
  titleAccent,
  description,
  primaryButtonText,
  primaryButtonAction,
  secondaryButtonText,
  secondaryButtonAction,
  secondaryButtonIcon: SecondaryButtonIcon
}: CTASectionProps) => {
  return (
    <section className="py-16 px-6">
      <div className="container mx-auto text-center">
        <Card className="neu-card border-0 max-w-4xl mx-auto">
          <CardContent className="p-12">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold">
                {title} <span className="gradient-accent bg-clip-text text-transparent">{titleAccent}</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                {description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="wave-shimmer"
                  onClick={primaryButtonAction}
                >
                  {primaryButtonText}
                </Button>
                {secondaryButtonText && secondaryButtonAction && (
                  <Button variant="outline" size="xl" onClick={secondaryButtonAction}>
                    {SecondaryButtonIcon && <SecondaryButtonIcon className="mr-2 h-5 w-5" />}
                    {secondaryButtonText}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CTASection;
