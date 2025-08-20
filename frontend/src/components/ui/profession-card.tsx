import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ProfessionCardProps {
  title: string;
  description: string;
  tags: string[];
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ProfessionCard({ 
  title, 
  description, 
  tags,
  selected, 
  onClick,
  className 
}: ProfessionCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-5 rounded-xl cursor-pointer transition-all duration-300",
        "border hover:shadow-lg active:scale-98",
        "bg-gradient-to-r from-card to-card",
        selected 
          ? "border-primary bg-gradient-to-r from-primary/5 to-primary/8 shadow-[0_4px_16px_hsl(var(--primary)/15%)]" 
          : "border-border hover:border-primary/30 shadow-[0_2px_8px_hsl(var(--border))]",
        className
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {selected && (
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 bg-primary-foreground rounded-full" />
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs px-2 py-1 bg-telegram-light-gray text-telegram-gray"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}